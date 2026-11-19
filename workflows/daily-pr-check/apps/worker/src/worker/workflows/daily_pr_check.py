import os
from datetime import UTC, datetime, timedelta
from typing import Any

from mistralai import workflows
from mistralai.workflows import workflow
from pydantic import BaseModel, Field

DEFAULT_OWNER = "felixdulfer"


class DailyPrCheckInput(BaseModel):
    owner: str = DEFAULT_OWNER
    stale_after_days: int = 14
    include_forks: bool = False
    max_repos: int = 200


class PullRequestSummary(BaseModel):
    number: int
    title: str
    author: str
    url: str
    created_at: str
    age_days: float
    ci_status: str | None
    review_decision: str | None


class RepoReport(BaseModel):
    repo: str
    open_prs: list[PullRequestSummary] = Field(default_factory=list)
    error: str | None = None


class DailyPrCheckOutput(BaseModel):
    generated_at: str
    owner: str
    repos: list[RepoReport]
    markdown: str


def _github_token() -> str:
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if not token:
        raise RuntimeError(
            "GITHUB_TOKEN is not set; bind it as a workspace secret on the deployment"
        )
    return token


def _github_api_url() -> str:
    return os.environ.get("GITHUB_API_URL", "https://api.github.com").rstrip("/")


def _client() -> Any:
    import httpx

    return httpx.AsyncClient(
        base_url=_github_api_url(),
        headers={
            "Authorization": f"Bearer {_github_token()}",
            "Accept": "application/vnd.github+json",
        },
        timeout=30.0,
    )


@workflows.activity(
    start_to_close_timeout=timedelta(seconds=60), retry_policy_max_attempts=3
)
async def list_owner_repos(
    owner: str, include_forks: bool, max_repos: int
) -> list[str]:
    repos: list[str] = []
    page = 1
    async with _client() as client:
        while len(repos) < max_repos:
            response = await client.get(
                "/user/repos",
                params={
                    "affiliation": "owner",
                    "per_page": 100,
                    "page": page,
                    "sort": "updated",
                },
            )
            response.raise_for_status()
            batch = response.json()
            if not batch:
                break
            for repo in batch:
                if repo["owner"]["login"] != owner or repo["archived"]:
                    continue
                if repo["fork"] and not include_forks:
                    continue
                repos.append(repo["full_name"])
            if len(batch) < 100:
                break
            page += 1
    return repos[:max_repos]


@workflows.activity(
    start_to_close_timeout=timedelta(seconds=60), retry_policy_max_attempts=3
)
async def fetch_open_prs(repo: str) -> list[dict]:
    async with _client() as client:
        response = await client.get(
            f"/repos/{repo}/pulls", params={"state": "open", "per_page": 100}
        )
        response.raise_for_status()
        return response.json()


@workflows.activity(
    start_to_close_timeout=timedelta(seconds=60), retry_policy_max_attempts=3
)
async def fetch_pr_details(repo: str, number: int) -> dict:
    async with _client() as client:
        pr = (
            (await client.get(f"/repos/{repo}/pulls/{number}"))
            .raise_for_status()
            .json()
        )
        sha = pr["head"]["sha"]
        status = await client.get(f"/repos/{repo}/commits/{sha}/status")
        ci_status = status.json().get("state") if status.status_code == 200 else None
        reviews = (
            (await client.get(f"/repos/{repo}/pulls/{number}/reviews"))
            .raise_for_status()
            .json()
        )
        decision = None
        for review in reversed(reviews):
            if review.get("state") in {"APPROVED", "CHANGES_REQUESTED"}:
                decision = review["state"]
                break
        return {"ci_status": ci_status, "review_decision": decision}


def _build_markdown(
    generated_at: datetime, owner: str, reports: list[RepoReport], stale_after_days: int
) -> str:
    lines = [
        f"# Daily PR check for github.com/{owner} — {generated_at.astimezone(UTC).isoformat()}",
        "",
    ]
    with_prs = [r for r in reports if r.open_prs]
    failed = [r for r in reports if r.error]
    if not with_prs and not failed:
        lines.append("No open pull requests in any repository. 🎉")
        return "\n".join(lines)
    for report in with_prs:
        lines.append(f"## {report.repo}")
        for pr in report.open_prs:
            stale = " **(stale)**" if pr.age_days >= stale_after_days else ""
            ci = f"CI: {pr.ci_status}" if pr.ci_status else "CI: n/a"
            review = (
                f"review: {pr.review_decision}"
                if pr.review_decision
                else "review: none"
            )
            lines.append(
                f"- #{pr.number} {pr.title} — @{pr.author}, open {pr.age_days:.0f}d{stale}, {ci}, {review} ({pr.url})"
            )
        lines.append("")
    for report in failed:
        lines.append(f"## {report.repo}")
        lines.append(f"⚠️ failed to fetch: {report.error}")
        lines.append("")
    return "\n".join(lines)


@workflow.define(
    name="daily-pr-check",
    workflow_display_name="Daily PR Check",
    workflow_description=(
        "Lists open pull requests with age, CI status and review state across all repositories "
        "of a GitHub user. Runs daily on a schedule; the report is the execution result."
    ),
)
class DailyPrCheckWorkflow:
    @workflow.entrypoint
    async def run(self, params: DailyPrCheckInput) -> DailyPrCheckOutput:
        now = workflow.now()
        repos = await list_owner_repos(
            params.owner, params.include_forks, params.max_repos
        )
        reports: list[RepoReport] = []
        for repo in repos:
            try:
                prs = await fetch_open_prs(repo)
                if not prs:
                    continue
                summaries: list[PullRequestSummary] = []
                for pr in prs:
                    details = await fetch_pr_details(repo, pr["number"])
                    created = datetime.fromisoformat(pr["created_at"])
                    age_days = (now - created).total_seconds() / 86400
                    summaries.append(
                        PullRequestSummary(
                            number=pr["number"],
                            title=pr["title"],
                            author=pr["user"]["login"],
                            url=pr["html_url"],
                            created_at=pr["created_at"],
                            age_days=age_days,
                            ci_status=details["ci_status"],
                            review_decision=details["review_decision"],
                        )
                    )
                reports.append(RepoReport(repo=repo, open_prs=summaries))
            except Exception as error:  # noqa: BLE001 per-repo failures must not fail the whole run
                reports.append(RepoReport(repo=repo, error=str(error)))
        markdown = _build_markdown(now, params.owner, reports, params.stale_after_days)
        return DailyPrCheckOutput(
            generated_at=now.isoformat(),
            owner=params.owner,
            repos=reports,
            markdown=markdown,
        )

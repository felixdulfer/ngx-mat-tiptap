import asyncio
import json
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
import pytest
from worker.workflows.daily_pr_check import (
    DailyPrCheckWorkflow,
    fetch_open_prs,
    fetch_pr_details,
    list_owner_repos,
)

OWNER = "felixdulfer"
OLD = (datetime.now(UTC) - timedelta(days=30)).isoformat().replace("+00:00", "Z")
NEW = datetime.now(UTC).isoformat().replace("+00:00", "Z")

REPO_A = f"{OWNER}/ngx-mat-tiptap"
REPO_B = f"{OWNER}/retro"

USER_REPOS_PAGE_1 = [
    {"full_name": REPO_A, "owner": {"login": OWNER}, "archived": False, "fork": False},
    {"full_name": REPO_B, "owner": {"login": OWNER}, "archived": False, "fork": False},
    {
        "full_name": f"{OWNER}/old-archived",
        "owner": {"login": OWNER},
        "archived": True,
        "fork": False,
    },
    {
        "full_name": f"{OWNER}/some-fork",
        "owner": {"login": OWNER},
        "archived": False,
        "fork": True,
    },
    {
        "full_name": "other-user/repo",
        "owner": {"login": "other-user"},
        "archived": False,
        "fork": False,
    },
]

PRS_A = [
    {
        "number": 42,
        "title": "feat: add something",
        "user": {"login": "someone"},
        "html_url": f"https://github.com/{REPO_A}/pull/42",
        "created_at": OLD,
    },
]
PRS_B = [
    {
        "number": 7,
        "title": "fix: another thing",
        "user": {"login": "else"},
        "html_url": f"https://github.com/{REPO_B}/pull/7",
        "created_at": NEW,
    },
]


def fake_send(request: httpx.Request) -> httpx.Response:
    path = request.url.path
    query = dict(request.url.params)
    routes: dict[str, Any] = {
        f"/repos/{REPO_A}/pulls": PRS_A,
        f"/repos/{REPO_B}/pulls": PRS_B,
        f"/repos/{REPO_A}/pulls/42": {"head": {"sha": "abc42"}},
        f"/repos/{REPO_B}/pulls/7": {"head": {"sha": "def7"}},
        f"/repos/{REPO_A}/commits/abc42/status": {"state": "success"},
        f"/repos/{REPO_B}/commits/def7/status": {"state": "pending"},
        f"/repos/{REPO_A}/pulls/42/reviews": [{"state": "CHANGES_REQUESTED"}],
        f"/repos/{REPO_B}/pulls/7/reviews": [],
    }
    if path == "/user/repos":
        if query.get("page") in (None, "1"):
            return httpx.Response(200, json=USER_REPOS_PAGE_1, request=request)
        return httpx.Response(200, json=[], request=request)
    if path in routes:
        return httpx.Response(200, json=routes[path], request=request)
    return httpx.Response(
        404, json={"message": f"no route for {request.method} {path}"}, request=request
    )


async def test_daily_pr_check(temporal_env, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GITHUB_TOKEN", "dummy-token-for-local-test")

    async def send(
        self: httpx.AsyncClient, request: httpx.Request, **kwargs: Any
    ) -> httpx.Response:
        return fake_send(request)

    monkeypatch.setattr(httpx.AsyncClient, "send", send)

    from mistralai.workflows.testing import create_test_worker

    async with create_test_worker(
        temporal_env,
        workflows=[DailyPrCheckWorkflow],
        activities=[list_owner_repos, fetch_open_prs, fetch_pr_details],
    ):
        handle = await temporal_env.client.start_workflow(
            "daily-pr-check",
            {"owner": OWNER, "stale_after_days": 14},
            id="test-daily-pr-check",
            task_queue="test-task-queue",
            execution_timeout=timedelta(seconds=10),
        )
        result = await asyncio.wait_for(handle.result(), timeout=15)
        assert result["owner"] == OWNER
        repos = {r["repo"]: r for r in result["repos"]}
        assert set(repos) == {REPO_A, REPO_B}
        pr_a = repos[REPO_A]["open_prs"][0]
        assert pr_a["number"] == 42
        assert pr_a["ci_status"] == "success"
        assert pr_a["review_decision"] == "CHANGES_REQUESTED"
        assert pr_a["age_days"] >= 29
        pr_b = repos[REPO_B]["open_prs"][0]
        assert pr_b["ci_status"] == "pending"
        assert pr_b["review_decision"] is None
        assert REPO_A in result["markdown"] and "#42" in result["markdown"]
        assert "stale" in result["markdown"]
        assert "old-archived" not in result["markdown"]
        assert "some-fork" not in result["markdown"]
        assert "other-user" not in result["markdown"]
        json.dumps(result)


async def test_daily_pr_check_handles_repo_failure(
    temporal_env, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("GITHUB_TOKEN", "dummy-token-for-local-test")

    async def send(
        self: httpx.AsyncClient, request: httpx.Request, **kwargs: Any
    ) -> httpx.Response:
        if request.url.path == f"/repos/{REPO_B}/pulls":
            return httpx.Response(500, json={"message": "boom"}, request=request)
        return fake_send(request)

    monkeypatch.setattr(httpx.AsyncClient, "send", send)

    from mistralai.workflows.testing import create_test_worker

    async with create_test_worker(
        temporal_env,
        workflows=[DailyPrCheckWorkflow],
        activities=[list_owner_repos, fetch_open_prs, fetch_pr_details],
    ):
        handle = await temporal_env.client.start_workflow(
            "daily-pr-check",
            {"owner": OWNER},
            id="test-daily-pr-check-failure",
            task_queue="test-task-queue",
            execution_timeout=timedelta(seconds=10),
        )
        result = await asyncio.wait_for(handle.result(), timeout=15)
        repos = {r["repo"]: r for r in result["repos"]}
        assert repos[REPO_B]["error"] is not None
        assert repos[REPO_A]["open_prs"][0]["number"] == 42

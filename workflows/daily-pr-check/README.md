# daily-pr-check

A [Mistral Workflow](https://docs.mistral.ai/studio/workflows/overview) (`mistralai-workflows` SDK) that runs
daily at 09:00 UTC and summarizes every open pull request across all repositories of a GitHub user (default
`felixdulfer`): PR number, title, author, age, CI status of the head commit, latest review decision. PRs open
longer than `stale_after_days` (default 14) are flagged stale. The report is the execution result (Mistral
Studio → Workflows → `daily-pr-check` → Executions); nothing is posted anywhere.

## Files

- `src/worker/workflows/daily_pr_check.py` — the `daily-pr-check` workflow and its GitHub activities
- `src/worker/__main__.py` — worker entrypoint (discovers `worker.workflows`, serves them)
- `tests/` — pytest tests on an in-memory Temporal environment with a stubbed GitHub API
- `Dockerfile` — managed-deployment image (build context: this directory)

## Local checks

```bash
cd workflows/daily-pr-check
uv sync --group dev
uv run pytest -q
```

## Deployment and schedule

Managed deployment `daily-pr-check` builds this directory from the pushed commit (build context
`workflows/daily-pr-check`, Dockerfile `Dockerfile`). GitHub access reads the `GITHUB_TOKEN` env var, bound
from the `GITHUB_TOKEN` workspace secret (create it in Mistral Studio → Secrets; a fine-grained PAT with
read access to the user's repositories is enough — scheduled runs cannot use the user-scoped OAuth credential
on the `github_app` connector). The daily schedule (`0 9 * * *` UTC, input `{"owner": "felixdulfer"}`) is
created via the Workflows API, not in worker code.

## Workflow input

| Field              | Default       | Meaning                                              |
| ------------------ | ------------- | ---------------------------------------------------- |
| `owner`            | `felixdulfer` | GitHub user whose repositories are checked           |
| `stale_after_days` | `14`          | Age after which an open PR is flagged stale          |
| `include_forks`    | `false`       | Include forked repositories (archived are excluded) |
| `max_repos`        | `200`         | Safety cap on repositories scanned                   |

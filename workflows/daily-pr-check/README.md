# daily-pr-check

A [Mistral Workflow](https://docs.mistral.ai/studio/workflows/overview) (Python, `mistralai-workflows` SDK) that
runs daily at 09:00 UTC and produces a summary of every open pull request across all repositories of a GitHub
user (default `felixdulfer`): PR number, title, author, age, CI status of the head commit, and latest review
decision. PRs open longer than `stale_after_days` (default 14) are flagged as stale.

The report is the workflow execution's result (visible in Mistral Studio under Workflows → `daily-pr-check` →
Executions). Nothing is posted anywhere else.

## Layout

Scaffolded with `mistral workflows init`; the workflow itself is
[`apps/worker/src/worker/workflows/daily_pr_check.py`](apps/worker/src/worker/workflows/daily_pr_check.py).
The worker entrypoint auto-discovers every workflow in `worker.workflows`, so no registration list exists.

- `apps/worker/src/worker/workflows/daily_pr_check.py` — workflow `daily-pr-check`, its input/output models, and the GitHub activities
- `apps/worker/tests/test_daily_pr_check.py` — pytest tests on an in-memory Temporal environment with a stubbed GitHub API
- `deploy/docker/Dockerfile.worker` — image for the managed deployment (build context: this directory)

## Running locally

```bash
cd workflows/daily-pr-check
uv sync --all-packages --group dev
cd apps/worker && uv run --all-packages pytest tests/ -q
```

## Deployment and schedule

The managed deployment builds this directory from the pushed commit:

- deployment name: `daily-pr-check`
- build context: `workflows/daily-pr-check`, Dockerfile `deploy/docker/Dockerfile.worker`
- the workspace secret `GITHUB_TOKEN` is bound to the `GITHUB_TOKEN` env var (create the secret in
  Mistral Studio → Secrets; a fine-grained PAT with read access to the user's repositories is enough)

The daily schedule (`0 9 * * *` UTC, input `{"owner": "felixdulfer"}`) is created through the Workflows API
(`create_workflow_schedule`), not in worker code, so it survives redeploys.

## Workflow input

| Field              | Default       | Meaning                                              |
| ------------------ | ------------- | ---------------------------------------------------- |
| `owner`            | `felixdulfer` | GitHub user whose repositories are checked           |
| `stale_after_days` | `14`          | Age after which an open PR is flagged stale          |
| `include_forks`    | `false`       | Include forked repositories (archived are excluded) |
| `max_repos`        | `200`         | Safety cap on repositories scanned                   |

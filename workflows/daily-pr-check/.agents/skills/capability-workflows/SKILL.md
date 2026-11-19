---
name: capability-workflows
description: >-
  Use when writing, editing, or debugging Mistral Workflows code (`mistralai.workflows`): workflows and activities, background jobs, multi-step pipelines, scheduled tasks, durable LLM agents, conversational workflows with human-in-the-loop, event streaming, third-party connectors, and any process needing fault tolerance, retries, or long-running execution. Also use when a determinism-sandbox error fires, when configuring payload encryption or a managed deployment, when driving executions from application code, and before reporting a workflow as done — it has to be linted and test-run first. Also use to troubleshoot issues with deploying or running workflows. Covers the determinism and import rules, the Mistral AI plugin API, activity timeouts and retries, worker discovery and registration, signals and HITL, and the vendored SDK reference documentation.
---

# Workflows

Mistral Workflows is a durable-execution platform: a Python framework (`mistralai.workflows`) whose workflows and activities survive crashes, retry automatically, and run from seconds to years, against a hosted control plane that schedules, streams, and traces them. This skill owns the authoring surface — the determinism and import rules, activity timeouts and retries, worker discovery, the Mistral AI plugin API — and vendors the SDK documentation indexed under [Reference documentation](#reference-documentation). It does **not** own the HTTP execution routes (the `fastapi-workflows-auth` overlay), the schedule implementations (the `python -m cli schedules` command, from the Evals capability), or the Compose and Helm overlays (`docker-compose-*`, `helm-*`); it depends only on `core`.

## Where things live

| Path | What |
| --- | --- |
| `apps/worker/src/worker/workflows/` | Feature workflows land here (`<feature>.py`), one module per workflow. |
| `apps/worker/src/worker/entrypoints/` | `worker.py` (discover + serve) and `dev.py` (hot-reload through the toolkit's `dev.serve`). |
| `apps/worker/{pyproject.toml,project.json}`, `apps/worker/tests/` | Pins `mistralai-workflows`; the `worker:semgrep` target; a graceful-shutdown test. |
| `mistralai_capabilities.workflows` (installed toolkit) | `client` (`get_client()` gives the configured `Mistral` client, `payload_encryption()` the payload-encryption config); `dev` (`serve()`, the hot-reload loop, which exits when the worker it launched exits). |
| `packages/py/env/src/env/workflows.py` | `env.workflows` settings: `WORKFLOWS_BASE_URL`, `DEPLOYMENT_NAME`. |
| `deploy/docker/Dockerfile.worker` | `workflows`, `workflows-dev` and `default` image stages. |
| `deploy/docker/worker-packages/` | Debian packages the worker image installs: one `<capability>.txt` per capability (one package per line, `#` comments), read by `install.sh`. |
| `.agents/skills/capability-workflows/{references,scripts}/` | This skill: the vendored SDK documentation indexed below, the `test_workflow.py` quick-test runner, and the Semgrep rules. |

Run `mistral apps dev --filter worker --json` from the app root. It starts the worker, so do not invoke the worker entrypoint yourself; the dev reloader picks up changes on the next file save. The worker auto-discovers every `@workflows.workflow.define` class in the `worker.workflows` package, so dropping a file in `apps/worker/src/worker/workflows/` is all that is needed — there is no registration list to update.

`MISTRAL_API_KEY`, `WORKFLOWS_BASE_URL`, and `DEPLOYMENT_NAME` live in the app-root `.env`, seeded by the installed capabilities. Set `MISTRAL_API_KEY` there; `DEPLOYMENT_NAME` defaults to `deployment-<app_name>-<user>`. The shared `env` package loads this file with `override=False`, so a value exported in your shell wins over the file. It locates the app root by walking up for a directory holding both `package.json` and `pyproject.toml`.

## Add a workflow

Drop a module in `apps/worker/src/worker/workflows/` — the worker discovers every `@workflows.workflow.define` class in the `worker.workflows` package. Workflow names must be unique.

```python
import mistralai.workflows as workflows

@workflows.workflow.define(name="my_workflow")
class MyWorkflow:
    @workflows.workflow.entrypoint
    async def run(self, data: MyInput) -> MyOutput:
        ...
```

This skill targets the **`mistralai-workflows` SDK v3.17.1 and higher**, the floor `apps/worker/pyproject.toml` pins. The import style above is canonical; focused snippets may use `from mistralai.workflows import workflow, activity, ...` instead.

- Call activities directly (`await my_activity(args)`); timeouts and retries live on the `@activity(...)` decorator, not at the call site.
- **All network I/O and SDK calls belong in an activity.** The sandbox enforces determinism inside workflow code. This covers operations that reach outside the sandbox: network, filesystem, and `mistralai` calls. In-workflow helpers such as `workflow.wait_condition()` and `workflow.sleep()` are fine; [Limitations](references/guides/limitations.mdx) lists what else is allowed in workflow code.
- **Never import `temporalio` directly.** The SDK re-exports everything user code needs, so workflows stay portable and deterministic: `workflow.now()` / `workflow.uuid4()` / `workflow.random()` replace `datetime.now()`, `uuid.uuid4()`, and `random`; `workflow.wait_condition()`, `workflow.continue_as_new()`, and `workflow.execute_workflow()` drive control flow; `activity_heartbeat()` heartbeats from inside an activity; `WorkflowError`, `ActivityError`, and `ParentClosePolicy` come from `mistralai.workflows` too. Escape hatches are `workflow.unsafe.imports_passed_through()` and `workflow.unsafe.skip_determinism_enforcement()`.
- **Calling Mistral:** use the plugin activities (`mistralai_chat_complete`, `mistralai_ocr`, `mistralai_embeddings`, `chat_parse_to_model`, …) or the plugin's `get_mistral_client()`, which adds completion telemetry, observability headers, and per-request identity that a raw client skips. Construct `mistralai.client.Mistral` only when `get_mistral_client()` cannot supply a configuration you need, and only inside the activity that uses it (a module-level import of the raw client pulls in `httpx2`, which the sandbox rejects at worker startup; see [Limitations](references/guides/limitations.mdx)). Details in [Workflows Plugins](references/guides/workflows-plugins.mdx).
- **Calling an external HTTP API or SDK:** read [External API Integration](references/guides/external-api-integration.mdx) — user token vs fixed service credential vs temporary service token, runtime secrets, encrypted payloads, idempotent writes. Prefer a workspace [connector](references/guides/connectors.mdx) when one can reach the API.
- **Calling another capability's activity:** import it and its models together from `mistralai_capabilities.<capability>.activities`/`.schemas` under `with workflows.workflow.unsafe.imports_passed_through():`, then await it like your own. Outside the block the worker fails validation (`RestrictedWorkflowAccessError`) or the call fails with `Input should be a valid dictionary or instance of <Model>`.
- **Driving executions from application code:** `await get_client()` from `mistralai_capabilities.workflows.client` gives the configured `Mistral` client; call `client.workflows.*` on it. Every call targets `WORKFLOWS_BASE_URL`. See [Python SDK](references/getting-started/python-sdk.mdx).

## Before you build

Every workflow definition needs an identity decision, and every execution needs run discipline:

- By default a workflow runs under the worker's identity: connector calls resolve the worker's credentials — for a deployment, its service identity. Anything a scheduled or triggered run needs must resolve there, so store workspace-scope credentials; a user-scope credential never resolves in this mode.
- `on_behalf_of=True` (OBO) runs on behalf of the triggering user — user-started runs only — and requires a hardened deployment, set at deployment creation. Model calls need no explicit API key: the user's credentials resolve dynamically, and an explicit key silently replaces the user's identity.
- Dry-run first: `dry_run` is a convention the mutating workflow implements, not a platform switch — execute with it on real data, show the result, and wait for the go-ahead before the real run. Poll long operations across calls; a single long call can exceed the platform's time budget.

The job references carry the detail when the task needs it: [Identity](references/identity.md), [Deploy and Run](references/deploy.md), [Triggers and Schedules](references/triggers.md), and [Failure Triage](references/triage.md) when something fails.

## Test & lint before done

Run the project's static checks from the app root before reporting a workflow as done. With the Code quality capability installed:

- `bunx nx run quality:lint` — Ruff lint checks
- `bunx nx run quality:fmt-check` — Ruff formatting checks (`bunx nx run quality:fix` applies formatting and lint fixes)
- `bunx nx run quality:typecheck` — ty static type checking

`bun run check` builds the app and runs the installed capabilities' check targets. Install the Testing capability to include its test suite. Run the advisory workflow rules with:

```bash
bunx nx run worker:semgrep
```

Then do a test run with sample inputs, using the `test_workflow.py` script:

```bash
cd apps/worker
uv run --all-packages python ../../.agents/skills/capability-workflows/scripts/test_workflow.py <workflow_file> --input '{"key": "value"}' [--timeout 15]
```

Keep timeouts tight — a hanging test wastes more time than a false timeout. The quick-test script's `--timeout` defaults to 30 seconds; pass `--timeout 15` for a faster loop. In pytest, use `execution_timeout=timedelta(seconds=10)` and `asyncio.wait_for(..., 15)`, the latter always slightly above the former. Raise them proportionally for a workflow you know is long-running (multi-step agent, large data processing), and only once you see a legitimate timeout failure — not preemptively.

**Never report a workflow as done before both the static checks and a test run pass.** Skipping them ships workflows that are non-deterministic, do I/O outside activities, or fail their first integration test.

## Gotchas

- The entrypoint's type hints **are** the API schema: the `fastapi-workflows-auth` overlay reflects them to build the HTTP route. Take exactly one parameter typed as a Pydantic model; primitives, unions, and extra parameters are rejected.
- An activity without retry arguments gets the SDK default: 3 attempts, backoff coefficient 2.0. Pass `retry_policy_max_attempts=1` on `@activity(...)` when a repeat would replay a partially applied write.
- Payload encryption is off unless you opt in. To encrypt, set `TEMPORAL_PAYLOAD_ENCRYPTION__MODE=full` and `TEMPORAL_PAYLOAD_ENCRYPTION__MAIN_KEY` to a key from `openssl rand -hex 32` for a self-hosted worker and for every process that starts or reads its executions, for example in the app-root `.env`. A caller without the key sends cleartext inputs and reads ciphertext results, with no error. To turn it off, delete every `TEMPORAL_PAYLOAD_ENCRYPTION__*` variable: `off` or a blank value fails the SDK import. A managed worker cannot receive the key. See [Payload Encoding](references/guides/payload-encoding.mdx).
- Deploy the worker with `mistral apps deploy`. It deploys the worker module marked `"platform": "workflows"` as a managed workflow deployment named `<app>-<module>`, at the current commit, on the Mistral Cloud backend, and waits for the rollout. Push the commit first. Start runs on it with `get_client()` and `deployment_name="<app>-<module>"`. See [Managed Deployments](references/guides/managed-deployments.mdx).

## Reference documentation

### Getting Started

- **[Introduction](references/getting-started/introduction.mdx)**: Overview of Mistral Workflows and its core architecture
- **[Value Proposition](references/getting-started/value-proposition.mdx)**: What the platform gives you over hand-rolled orchestration — durable-execution foundations, the DX shortcuts, and the complete feature list
- **[Installation](references/getting-started/installation.mdx)**: Guide to installing and setting up the Workflows framework (CLI scaffolding, optional deps)
- **[Core Concepts](references/getting-started/core-concepts.mdx)**: Workflows, activities, workers, executions vs runs
- **[Python SDK](references/getting-started/python-sdk.mdx)**: Programmatic API via the `mistralai` client (`client.workflows.*`)
- **[Your First Workflow](references/getting-started/your-first-workflow.mdx)**: Step-by-step guide to creating your first workflow

### Guides

- **[Workflows](references/guides/workflows.mdx)**: Creating workflows, determinism enforcement (sandbox), input types, timeouts, signals/queries/updates, child workflows, continue-as-new
- **[Activities](references/guides/activities.mdx)**: Timeouts, retries, heartbeats, local activities, sticky sessions, nested activities
- **[Workflows Exception Handling](references/guides/workflows-exception.mdx)**: WorkflowsException, ErrorCode enum, factory methods
- **[Error Codes](references/guides/error-codes.mdx)**: API error codes WF_1000-WF_1600 with HTTP status, description, and resolution
- **[Signals, Queries, and Updates](references/guides/signals-queries-updates.mdx)**: Workflow communication patterns with input validation
- **[Search Keys](references/guides/search-keys.mdx)**: Custom key/value pairs you can attach to an execution to find it easily. Use when there are non-private interesting business keys
- **[Scheduling](references/guides/scheduling.mdx)**: Cron expressions, ScheduleDefinition, SchedulePolicy, overlap handling
- **[Dependency Injection](references/guides/dependency-injection.mdx)**: FastAPI-style Depends() pattern
- **[Streaming](references/guides/streaming.mdx)**: Task API, token streaming, progress updates
- **[Streaming Consumption](references/guides/streaming-consumption.mdx)**: `client.workflows.events.get_stream_events_async()`, NATS subjects, SSE API
- **[Concurrency](references/guides/concurrency.mdx)**: execute_activities_in_parallel() with List/Chain/Offset executors
- **[Rate Limiting](references/guides/rate-limiting.mdx)**: Distributed rate limiting across workers
- **[Handling Large Data](references/guides/handling-large-data.mdx)**: OffloadableField, blob storage (S3/Azure/GCS)
- **[Payload Encoding](references/guides/payload-encoding.mdx)**: Payload offloading, AES-GCM encryption, key rotation
- **[Observability](references/guides/observability.mdx)**: OpenTelemetry traces, trace sampling
- **[Durable Agents](references/guides/durable-agents.mdx)**: Agent, Runner, RemoteSession/LocalSession, MCP, multi-agent handoffs
- **[Connectors](references/guides/connectors.mdx)**: Call third-party tools (GitHub, Notion, Slack, ...) as the triggering user (`on_behalf_of=True`) from a workflow or give them to an agent, without holding the service's credentials
- **[External API Integration](references/guides/external-api-integration.mdx)**: Call an external HTTP API or SDK from an activity when no connector fits — identities, secrets, encryption, limits and retries
- **[Conversational Workflows: Inputs](references/guides/assist-workflows.mdx)**: Getting started, ChatInput/timeout, structured form inputs and field types, confirmation inputs, todo list
- **[Conversational Workflows: Rich Output & UI](references/guides/assist-workflows-output.mdx)**: Streaming agent responses, rich outputs/canvas, canvas editing HITL, rich UI components, tool UI states
- **[Conversational Workflows: Platform Integration](references/guides/assist-workflows-platform.mdx)**: Publish in Vibe, tagging input variants, error handling, structured content, complete example
- **[Local Execution](references/guides/local-execution.mdx)**: No-infra dev mode with Pydantic model params
- **[Limitations](references/guides/limitations.mdx)**: System constraints, determinism rules, sandbox import restrictions (module-level non-deterministic imports + `imports_passed_through`), I/O and heavy work belongs in activities, execution-history limits
- **[Workflows Plugins](references/guides/workflows-plugins.mdx)**: Mistral AI plugin (calling chat / structured-output / embeddings / OCR models), Webhook plugin, Nuage plugin, custom plugins
- **[Deployment Patterns](references/guides/_deployment-patterns.mdx)**: Best practices for deploying workflows
- **[Managed Deployments](references/guides/managed-deployments.mdx)**: `mistral apps deploy` for hosting the worker on the Mistral platform from the repo, deployment names, build secrets for private indexes, dispatching to the deployed worker
- **[Migration v2 to v3](references/guides/migration-v2-to-v3.mdx)**: Breaking changes and upgrade steps from SDK v2 through v3.4.0

### Testing & Diagnostics

- **[Testing Workflows](references/guides/testing.md)**: Integration testing with `create_test_worker`, hang prevention, sandbox pitfalls
- **[Diagnostics](references/guides/diagnostics.md)**: Run `wf-diagnose` locally or on Kubernetes to collect a diagnostic report for support triage

### Internal References

Additional patterns and utilities not covered in the official docs:

- **[Execution IDs](references/execution_ids.md)**: Generate deterministic execution IDs for child workflows
- **[Pipeline Pattern](references/pipeline_pattern.md)**: Build multi-step workflows with declarative StepSpec definitions
- **[Workflow Testing](references/workflow_testing.md)**: Ensure workflow classes are properly registered in workers
- **[Identity](references/identity.md)**: Worker identity vs on-behalf-of, credential scopes, and why OBO needs no explicit API key
- **[Deploy and Run](references/deploy.md)**: Revisions, budgets, dry-run discipline, and reading executions after every run
- **[Triggers and Schedules](references/triggers.md)**: Webhook sources, idempotent sweeps, and dispatch to the deployment
- **[Failure Triage](references/triage.md)**: Triage order and gateway failure signatures (401/404, empty logs, stuck builds, budget errors)

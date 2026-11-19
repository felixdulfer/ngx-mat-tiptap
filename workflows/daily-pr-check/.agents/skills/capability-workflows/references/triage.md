# Failure Triage: events, logs, and signatures

Debugging is reading, not guessing. [Identity](identity.md), [Deploy and Run](deploy.md), and [Triggers and Schedules](triggers.md) carry the discipline; this page is the triage order and the signature table.

## Triage order

1. Execution events: which activity failed, with what message. Check this after every execute, failed or not.
2. Execution logs: often empty. Do not conclude anything from an empty log.
3. Deployment runtime logs: the reliable source for activity failures — a missing connector credential can read only as "Activity task failed" in the events and live here.

## Failure signatures

| Symptom | Meaning | Fix |
| --- | --- | --- |
| Gateway 401, empty body | No credential on the connector, or the credential scope cannot be resolved by the calling identity (a user-started run with a workspace-only setup, or a headless run with a user-scope credential) | List the connector's credentials, then create or re-scope the credential to match the consumer |
| Gateway 404 | Wrong connector name (the API suffixes names) or the connector is not visible to the caller | Use the returned name in configuration; check the connector's visibility |
| 401 or 404 with a JSON body from the third party | The token exists but its scopes or target are wrong (a fine-grained PAT without the repository selected; an org-scoped App token that cannot see the repo) | Fix the token scopes; a cached installation token can lag a new repository grant |
| Connector auth silently fails, or gateway 401s, on an OBO workflow | The deployment was created without hardening: OBO requires a hardened deployment, and hardening is set only at deployment creation | Recreate the deployment with hardening; check the deployment's hardening before debugging credentials |
| "Failed activation" or replay loops during debugging | Non-determinism in workflow code: module-level state mutation or a non-hermetic call on the replay path | Move the state into the workflow instance or an activity; see [Limitations](guides/limitations.mdx) |
| Build stuck in a running state, zero log lines | Undiagnosable as-is | Compare elapsed time to the expected duration; read the build logs; do not wait indefinitely |
| A long call fails with a budget or timeout error | A single call ran past the platform's per-program time budget | Poll across calls in smaller pieces; retry the read |
| A tool reports an error with no detail | The tool layer dropped the server's message | Go one level deeper — events, deployment runtime logs, the underlying API call — for the real cause |
| Deployment fails right after push | Often the Mistral GitHub App is not installed on the repository, or the working directory or entrypoint is wrong | Verify the app's access, the working directory, and the entrypoint |

## Discipline

- Never re-run a failing execution unchanged: read the events and logs, change something (an input, a scope, a setting), then run again.
- Re-check the critical fact with a single-item read; list views can misreport status (a merged flag, a credential state).
- When the root cause is a platform gap (an opaque error, a missing tool), fix what you can in the workflow and report the gap through the normal support channel rather than working around it silently.

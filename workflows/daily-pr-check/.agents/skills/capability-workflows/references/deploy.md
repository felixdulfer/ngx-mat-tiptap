# Deploy and Run: revisions, budgets, and dry-runs

Operational rules for getting a workflow from code to a verified running service.

- Deploy the app's worker with `mistral apps deploy` (see [Managed Deployments](guides/managed-deployments.mdx)); a standalone repository deploys through the managed-deployment API or MCP tools. In both cases push the commit first — deploys build from the pushed commit.
- Re-deploy an existing deployment with the new revision instead of creating a second one under a new name.
- Poll long operations across calls. A single call that waits through a build can exceed the platform's per-program time budget; never sleep in a loop, and never trust a wait-style call to survive a long build.
- Dry-run first — but `dry_run` is a convention the workflow must implement, not a platform-wide switch: no platform option suppresses writes. A mutating workflow implements a `dry_run` input whose activities skip their writes and report what they would do; execute with it on real data, show the result, and wait for the go-ahead before the real run. On a workflow without the input, an execution performs its writes.
- Read the execution events after every execute. Execution logs can come back empty; the deployment's runtime logs are the fallback.
- Validate connector tool arguments against the tool's field schema before deploying — field-enum errors surface only at run time. Connector results are MCP-wrapped (`content[0].text`, JSON-parse) and their shapes vary per tool; parse defensively.
- Never re-run a failing execution unchanged: read the events and logs, change something, then run again.
- A build that stays in a running state with no log lines is suspect: compare elapsed time to the expected duration instead of waiting indefinitely.
- After the real run, verify the effect in the destination (the message landed, the row changed) with a live read before declaring success.

## Steps only the user can do

- Studio and third-party UI steps: describe only options you have verified exist. If unsure, ask for the exact visible options in one question instead of guessing.

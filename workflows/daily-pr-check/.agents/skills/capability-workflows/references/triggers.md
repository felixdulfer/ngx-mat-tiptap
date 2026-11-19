# Triggers and Schedules: webhooks and idempotent sweeps

- Webhook sources: the verification token is displayed by the source — re-check the current API surface instead of assuming an endpoint to fetch it exists. The third party's subscription step is often UI-only (some providers expose no webhooks API at all, and personal tokens often cannot own webhooks): hand over the exact steps instead of attempting them.
- Design scheduled sweeps to be idempotent: a schedule fires whether or not the last run finished. Process a lookback window computed from `workflow.now()`, detect already-processed items before acting, and make re-running an interval harmless. See [Scheduling](guides/scheduling.mdx) for the schedule API and overlap policies.
- A trigger dispatches to the workflow's deployment: a locally running worker never receives the firing. Validate the loop against the deployed workflow, and read the fired run's execution events before calling the wiring done.

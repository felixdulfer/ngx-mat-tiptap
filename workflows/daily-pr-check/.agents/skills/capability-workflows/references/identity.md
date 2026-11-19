# Identity: worker identity vs on-behalf-of

The identity a workflow runs under is a definition-level decision, not a runtime default:

- By default the workflow runs under the worker's identity, whoever started it: connector calls resolve the worker's credentials — for a deployment, its service identity. Anything a scheduled or triggered run needs must resolve there, so store workspace-scope credentials.
- User credentials apply only to a workflow defined with `on_behalf_of=True` (OBO, which requires a hardened deployment): it runs on behalf of the triggering user, and connector calls resolve that user's credentials on user-started runs.
- Under OBO, model calls need no explicit API key either: the plugin activities and `get_mistral_client()` resolve the triggering user's credentials dynamically on user-started runs. Passing an explicit key silently replaces the user's identity with the key's — never do it in an OBO workflow.
- A user-scope credential on a default-mode workflow is never resolved by the worker's identity: it fails at run time. The wrong-scope failure appears exactly when the workflow goes live — a scheduled run under a user-scope credential fails even though every manual check passed.
- A headless deployment cannot complete an interactive OAuth flow: give its connectors credentials beforehand.

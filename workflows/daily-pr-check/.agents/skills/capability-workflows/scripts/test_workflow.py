#!/usr/bin/env python3
"""Workflow test runner -- starts a real worker, executes via the API, reports the result.

Usage:
    python test_workflow.py <file> --input '{}'
    python test_workflow.py <file> --input '{}' --interactions '[{"choice": "WFL"}]'
    python test_workflow.py <file> --input '{}' --timeout 60 --workflow-name my-wf

For interactive workflows (those extending InteractiveWorkflow), pass --interactions
with a JSON array.  Each element is submitted in order to the next wait_for_input() call.

Exit codes: 0 = passed, 1 = failed/timed out, 2 = bad arguments.
"""

# ruff: noqa: T201  every print here is deliberate CLI feedback

from __future__ import annotations

import argparse
import asyncio
import contextlib
import importlib
import importlib.util
import inspect
import json
import re
import sys
import traceback
from pathlib import Path
from typing import TYPE_CHECKING, Any, cast

if TYPE_CHECKING:
    from collections.abc import Callable

# SDK imports (deferred to avoid import errors when just running --help); typed Any
# as an untyped boundary, and loaded via importlib so linting sees no unresolved imports.
workflows: Any = None
get_mistral_client: Any = None
get_workflow_definition: Any = None
BaseModel: Any = None
_sdk_imported = False


def _ensure_sdk() -> None:
    global _sdk_imported, workflows, get_mistral_client, get_workflow_definition, BaseModel
    if _sdk_imported:
        return
    from pydantic import BaseModel as _BaseModel

    workflows = importlib.import_module("mistralai.workflows")
    _client = importlib.import_module("mistralai.workflows.client")
    _defmod = importlib.import_module("mistralai.workflows.core.definition.workflow_definition")
    get_mistral_client = _client.get_mistral_client
    get_workflow_definition = _defmod.get_workflow_definition
    BaseModel = _BaseModel
    _sdk_imported = True


async def _create_capability_client() -> tuple[Any, str | None, str | None]:
    try:
        # Shared settings load the app-root .env before the SDK reads its configuration.
        workflows_env = importlib.import_module("env.workflows").env
        mistral_env = importlib.import_module("env.mistral").env
        _ensure_sdk()
        sdk_config = importlib.import_module("mistralai.workflows.core.config.config").config
        encryption = importlib.import_module("mistralai_capabilities.workflows.client").payload_encryption()
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            "The workflows capability packages are required. Run uv sync --all-packages "
            "from the app root, then run this script with uv run --all-packages."
        ) from exc

    if not mistral_env.mistral_api_key:
        raise SystemExit(
            "Error: MISTRAL_API_KEY is not set or empty. Set it in the app-root .env, or export it in your shell."
        )

    from pydantic import SecretStr

    sdk_config.worker.server_url = workflows_env.workflows_base_url
    sdk_config.worker.deployment_name = workflows_env.deployment_name
    sdk_config.common.mistral_api_key = SecretStr(mistral_env.mistral_api_key) if mistral_env.mistral_api_key else None
    sdk_config.worker.temporal_payload_encryption = encryption
    client = get_mistral_client(api_key=mistral_env.mistral_api_key)
    if encryption is not None:
        encoding_config = importlib.import_module("mistralai.extra.workflows.encoding.config")
        encoding_helpers = importlib.import_module("mistralai.extra.workflows.encoding.helpers")
        helpers = importlib.import_module("mistralai.extra.workflows.helpers")
        namespace = await helpers.get_scheduler_namespace(client, server_url=workflows_env.workflows_base_url)
        await encoding_helpers.configure_workflow_encoding(
            encoding_config.WorkflowEncodingConfig(payload_encryption=encryption),
            client=client,
            namespace=namespace,
        )
    return client, workflows_env.deployment_name, mistral_env.mistral_api_key


def _import_module(file_path: Path) -> Any:
    """Import a Python module from a filesystem path."""
    spec = importlib.util.spec_from_file_location(file_path.stem, file_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot create module spec for {file_path}")
    mod = importlib.util.module_from_spec(spec)
    sys.modules[file_path.stem] = mod
    spec.loader.exec_module(mod)
    return mod


def _find_workflow_classes(module: Any) -> list[type]:
    """Return all @workflow.define classes in *module*."""
    return [obj for _, obj in inspect.getmembers(module, inspect.isclass) if hasattr(obj, "__workflows_workflow_def")]


def _workflow_name(cls: type) -> str:
    return get_workflow_definition(cls).name


def _is_interactive(cls: type) -> bool:
    return issubclass(cls, workflows.InteractiveWorkflow)


_CHILD_CALL_RE = re.compile(r"execute(?:_child)?_workflow\(\s*(?:workflow\s*=\s*)?([A-Za-z_]\w*)")


def _child_class_names(source: str) -> set[str]:
    """Class names referenced as children via execute_workflow / execute_child_workflow."""
    return set(_CHILD_CALL_RE.findall(source))


def _select_entrypoint(
    classes: list[type],
    source: str,
    name_override: str | None,
    name_of: Callable[[type], str],
    module: object | None = None,
) -> type | None:
    """Choose which workflow to execute.

    With ``name_override`` pick the matching registered name. Otherwise the entrypoint is the one
    workflow not used as a child via ``execute_workflow(...)``, falling back to the first when
    ambiguous.
    """
    if name_override:
        for c in classes:
            if name_of(c) == name_override:
                return c
        return None
    if len(classes) == 1:
        return classes[0]
    child_names = _child_class_names(source)

    def _is_child(c: type) -> bool:
        if c.__name__ in child_names:
            return True
        return module is not None and any(getattr(module, ident, None) is c for ident in child_names)

    candidates = [c for c in classes if not _is_child(c)]
    if len(candidates) == 1:
        return candidates[0]
    return (candidates or classes)[0]


def _discover_workflow(workflow_file: Path, name_override: str | None) -> tuple[type, str, bool, list[type]]:
    """Find workflow classes and select the entrypoint.

    Returns ``(entrypoint_cls, name, interactive, all_classes)``. Every discovered class must be
    registered so a parent's child sub-workflows can run.
    """
    module = _import_module(workflow_file)
    found = _find_workflow_classes(module)

    if not found:
        raise SystemExit(
            f"No workflow classes found in {workflow_file}. "
            "Ensure the file has a class decorated with @workflow.define."
        )

    cls = _select_entrypoint(found, workflow_file.read_text(), name_override, _workflow_name, module)
    if cls is None:
        available = ", ".join(_workflow_name(w) for w in found)
        raise SystemExit(f"Workflow '{name_override}' not found. Available: {available}")

    if not name_override and len(found) > 1:
        print(
            f"Multiple workflows found; executing '{_workflow_name(cls)}' and registering "
            f"all {len(found)}. Pass --workflow-name to override.",
            file=sys.stderr,
        )

    return cls, _workflow_name(cls), _is_interactive(cls), found


def _build_input(input_data: dict[str, Any]) -> dict[str, Any] | None:
    """Return the input dict for the API client, or None if empty."""
    if not input_data:
        return None
    return input_data


async def _poll_and_submit_interactions(
    client: Any,
    execution_id: str,
    interactions: list[dict[str, Any]],
    poll_timeout: float = 60.0,
    poll_interval: float = 0.5,
) -> None:
    """Poll __get_pending_inputs and submit each interaction response in order."""

    class _Payload(BaseModel):
        task_id: str
        input: dict[str, Any]

    for i, response_data in enumerate(interactions, 1):
        task_id = await _wait_for_pending_input(client, execution_id, i, poll_timeout, poll_interval)

        print(f"  Interaction {i}: submitting {json.dumps(response_data)}")
        try:
            payload = _Payload(task_id=task_id, input=response_data)
            resp = await asyncio.wait_for(
                client.workflows.executions.update_workflow_execution_async(
                    execution_id=execution_id,
                    name="__submit_input",
                    input=payload.model_dump(mode="json"),
                ),
                timeout=30,
            )
        except TimeoutError:
            print(
                f"  Interaction {i}: update timed out (workflow may have failed to process the input)",
                file=sys.stderr,
            )
            raise

        error = resp.result.get("error") if isinstance(resp.result, dict) else None
        if error:
            raise RuntimeError(f"Interaction {i} rejected: {error}")
        print(f"  Interaction {i}: accepted")


async def _wait_for_pending_input(
    client: Any,
    execution_id: str,
    index: int,
    timeout: float,
    interval: float,
) -> str:
    """Block until a pending input appears, return its task_id."""
    start = asyncio.get_event_loop().time()
    last_error: Exception | None = None
    while True:
        try:
            resp = await client.workflows.executions.query_workflow_execution_async(
                execution_id=execution_id, name="__get_pending_inputs"
            )
            pending = resp.result.get("pending_inputs", [])
            if pending:
                task_id = pending[0]["task_id"]
                label = pending[0].get("label", "")
                print(f"  Interaction {index}: pending input found (task={task_id[:8]}..., label={label!r})")
                return task_id
        except Exception as exc:
            last_error = exc
        else:
            last_error = None

        if asyncio.get_event_loop().time() - start > timeout:
            msg = f"Timeout waiting for pending input #{index} ({timeout}s)"
            if last_error is not None:
                msg += f"; last query error: {last_error!r}"
            raise TimeoutError(msg)
        await asyncio.sleep(interval)


async def _execute_with_retry(
    client: Any,
    wf_name: str,
    input_dict: dict[str, Any] | None,
    deployment_name: str | None = None,
    retries: int = 10,
) -> Any:
    """Start the workflow, retrying on registration-propagation errors."""
    kwargs: dict[str, Any] = {"workflow_identifier": wf_name, "input": input_dict}
    if deployment_name:
        kwargs["deployment_name"] = deployment_name
    for attempt in range(retries):
        try:
            return await client.workflows.execute_workflow_async(**kwargs)
        except Exception:
            if attempt == retries - 1:
                raise
            await asyncio.sleep(1)
    raise RuntimeError("workflow did not start after retries")


async def _await_result(
    client: Any,
    execution_id: str,
    interactions: list[dict[str, Any]] | None,
    interactive: bool,
    timeout: int,
) -> dict[str, Any]:
    """Wait for workflow completion, submitting interactions if needed.

    Uses asyncio.wait with FIRST_EXCEPTION so an interaction error surfaces immediately instead of
    blocking until the overall timeout.
    """
    if not (interactive and interactions):
        final = await asyncio.wait_for(
            client.workflows.wait_for_workflow_completion_async(execution_id, polling_interval=2),
            timeout=timeout,
        )
        return final.result

    # Run interactions and completion polling concurrently.
    interaction_task = asyncio.create_task(
        _poll_and_submit_interactions(client, execution_id, interactions, poll_timeout=timeout)
    )
    completion_task = asyncio.create_task(
        client.workflows.wait_for_workflow_completion_async(execution_id, polling_interval=2)
    )

    done, pending = await asyncio.wait(
        [interaction_task, completion_task],
        timeout=timeout,
        return_when=asyncio.FIRST_EXCEPTION,
    )
    for t in pending:
        t.cancel()
        with contextlib.suppress(asyncio.CancelledError, Exception):
            await t

    if not done:
        raise TimeoutError()

    # Surface errors -- interaction errors take priority.
    if interaction_task in done and interaction_task.exception():
        raise interaction_task.exception()
    if completion_task in done and completion_task.exception():
        raise completion_task.exception()

    if completion_task in done:
        return completion_task.result().result

    raise TimeoutError()


# How long to wait after starting the worker before executing.
# The worker needs time to register the workflow with the API and
# start polling the task queue.  8s is empirically reliable.
_WORKER_READY_DELAY = 8


async def run_workflow(
    workflow_file: Path,
    input_data: dict[str, Any],
    timeout_seconds: int,
    workflow_name_override: str | None,
    interactions: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Start a real worker, execute the workflow, and return the result."""
    client, deployment_name, api_key = await _create_capability_client()

    workflow_cls, wf_name, interactive, all_classes = _discover_workflow(workflow_file, workflow_name_override)

    print(f"Workflow:      {wf_name} ({workflow_cls.__name__})")
    print(f"Interactive:   {interactive}")
    print(f"Input:         {json.dumps(input_data)}")
    if deployment_name:
        print(f"Deployment:    {deployment_name}")
    if interactions:
        print(f"Interactions:  {len(interactions)} response(s) queued")
    print(f"Timeout:       {timeout_seconds}s")
    print()

    if interactive and not interactions:
        print(
            "WARNING: Interactive workflow but no --interactions provided.\n"
            "         The workflow will hang at wait_for_input().\n",
            file=sys.stderr,
        )

    # Register ALL discovered workflows, not just the entrypoint, so a parent's
    # child sub-workflows resolve. Activities are auto-discovered by the SDK.
    print("Starting worker...")
    worker_task = await workflows.run_worker(all_classes, detach=True, api_key=api_key)
    if worker_task is None:
        raise RuntimeError("run_worker(detach=True) returned None")
    print("Worker started.")

    print("Waiting for worker to be ready...", end="", flush=True)
    await asyncio.sleep(_WORKER_READY_DELAY)
    print(" ready.\n")

    execution_id: str | None = None
    try:
        execution = await _execute_with_retry(client, wf_name, _build_input(input_data), deployment_name)
        execution_id = cast("str", execution.execution_id)
        print(f"Execution:     {execution_id}")
        print(f"Status:        {execution.status}\n")

        return await _await_result(client, execution_id, interactions, interactive, timeout_seconds)

    except TimeoutError:
        if execution_id:
            print(f"\nTerminating execution {execution_id}...", file=sys.stderr)
            try:
                await client.workflows.executions.terminate_workflow_execution_async(execution_id=execution_id)
                print("Execution terminated.", file=sys.stderr)
            except Exception as e:
                print(f"Failed to terminate: {e}", file=sys.stderr)
        raise

    finally:
        if worker_task and not worker_task.done():
            worker_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await worker_task


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run a workflow with a real worker and the Workflows API.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "workflow_file",
        type=Path,
        help="Path to the Python file containing the workflow.",
    )
    parser.add_argument(
        "--input",
        required=True,
        dest="input_json",
        help="JSON string with the workflow input.",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=30,
        help="Max seconds before the workflow is killed (default: 30).",
    )
    parser.add_argument(
        "--workflow-name",
        default=None,
        help="Workflow name (if the file contains multiple workflows).",
    )
    parser.add_argument(
        "--interactions",
        default=None,
        dest="interactions_json",
        help=('JSON array of interaction responses for interactive workflows. Example: \'[{"choice": "WFL"}]\''),
    )
    return parser.parse_args()


def _parse_json(raw: str, label: str) -> Any:
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"Error: invalid JSON in {label}: {e}", file=sys.stderr)
        raise SystemExit(2) from e


def main() -> None:
    args = _parse_args()

    if not args.workflow_file.is_file():
        print(f"Error: {args.workflow_file} does not exist.", file=sys.stderr)
        raise SystemExit(2)

    input_data = _parse_json(args.input_json, "--input")

    interactions = None
    if args.interactions_json:
        interactions = _parse_json(args.interactions_json, "--interactions")
        if not isinstance(interactions, list):
            print("Error: --interactions must be a JSON array.", file=sys.stderr)
            raise SystemExit(2)

    # Add workflow's directory to sys.path for relative imports.
    parent = str(args.workflow_file.resolve().parent)
    if parent not in sys.path:
        sys.path.insert(0, parent)

    try:
        result = asyncio.run(
            run_workflow(
                args.workflow_file.resolve(),
                input_data,
                args.timeout,
                args.workflow_name,
                interactions,
            )
        )
        print("PASSED")
        print(json.dumps(result, indent=2, default=str))
    except SystemExit:
        raise
    except TimeoutError as timeout_error:
        print("FAILED: workflow timed out", file=sys.stderr)
        raise SystemExit(1) from timeout_error
    except Exception as error:
        print("FAILED:", file=sys.stderr)
        traceback.print_exc()
        raise SystemExit(1) from error


if __name__ == "__main__":
    main()

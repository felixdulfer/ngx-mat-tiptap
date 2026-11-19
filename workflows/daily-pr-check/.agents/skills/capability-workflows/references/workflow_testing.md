# Workflow Registration Testing

Ensure the worker discovers every workflow class you define. A common issue is creating a workflow file outside the discovery path, so the worker never registers it.

## How Discovery Works


The worker calls `mistralai.workflows.discover_all_workflows_in_package("worker.workflows")`. That scans modules and subpackages under `worker.workflows`, which maps to `apps/worker/src/worker/workflows/`, for `@workflows.workflow.define` classes.


Check these cases if a workflow is missing:

1. The file is not in `apps/worker/src/worker/workflows/` (e.g. created at the project root).

2. The module raises on import. SDK discovery logs the error and skips that module.
3. Another class already registered the same `@workflows.workflow.define(name=...)`. SDK discovery keeps the first and logs `Skipping duplicate workflow` for the rest.


## Verify Discovery

Run the worker and check the startup log:

```bash
mistral apps dev --filter worker --json
```


The worker logs `workflow discovery complete` with the workflow names in the `workflows` field.

If your workflow is missing, confirm the file is under `apps/worker/src/worker/workflows/` and that it imports cleanly:

```bash
cd apps/worker
uv run --all-packages python -c "import worker.workflows.my_workflow; print('imported OK')"
```

## Test That Every Decorated Class Is Discovered

Save this as `apps/worker/tests/test_discovery.py`. It scans `src/worker/workflows/` for `@workflows.workflow.define` classes and checks that the worker's discovery function registers each one:

```python
import ast
from pathlib import Path

import mistralai.workflows as workflows


WORKFLOWS_DIR = Path(__file__).parent.parent / "src/worker/workflows/"


def _find_workflow_decorated_classes() -> set[str]:
    """Names of every @workflows.workflow.define class under src/worker/workflows/."""
    found: set[str] = set()

    def is_workflow_decorator(node: ast.expr, imports: dict[str, str]) -> bool:
        if isinstance(node, ast.Call):
            node = node.func
        attributes: list[str] = []
        while isinstance(node, ast.Attribute):
            attributes.append(node.attr)
            node = node.value
        if not isinstance(node, ast.Name) or node.id not in imports:
            return False
        qualified_name = ".".join([imports[node.id], *reversed(attributes)])
        return qualified_name == "mistralai.workflows.workflow.define"

    for py_file in WORKFLOWS_DIR.rglob("*.py"):
        if py_file.name == "__init__.py":
            continue
        try:
            tree = ast.parse(py_file.read_text())
        except SyntaxError:
            continue
        imports: dict[str, str] = {}
        for node in tree.body:
            if isinstance(node, ast.Import):
                for alias in node.names:
                    name = alias.asname or alias.name.split(".")[0]
                    imports[name] = alias.name if alias.asname else name
            elif isinstance(node, ast.ImportFrom) and node.module and not node.level:
                for alias in node.names:
                    imports[alias.asname or alias.name] = f"{node.module}.{alias.name}"
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                if any(is_workflow_decorator(d, imports) for d in node.decorator_list):
                    found.add(node.name)

    return found


def test_all_workflow_classes_are_discovered() -> None:
    decorated = _find_workflow_decorated_classes()
    discovered = workflows.discover_all_workflows_in_package("worker.workflows")


    missing = decorated - {cls.__name__ for cls in discovered}
    assert not missing, (
        f"These @workflow.define classes were not discovered by the worker. "
        f"Check that each file is under src/worker/workflows/ and imports cleanly: {missing}"
    )
```

The AST scan checks source files independently of worker discovery, so the assertion catches decorated classes the worker does not register.


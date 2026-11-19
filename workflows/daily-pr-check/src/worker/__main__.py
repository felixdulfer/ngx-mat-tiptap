import asyncio
import os

from mistralai import workflows
from mistralai.workflows.client import config


async def main() -> None:
    deployment_name = os.environ.get("DEPLOYMENT_NAME")
    if deployment_name:
        config.worker.deployment_name = deployment_name
    workflow_classes = workflows.discover_all_workflows_in_package("worker.workflows")
    await workflows.run_worker(workflow_classes)


if __name__ == "__main__":
    asyncio.run(main())

"""Pull task -> run agents -> produce result (minimal, no external broker)."""
from __future__ import annotations

from typing import Any

from .confluence_tasks import task_from_dict, task_to_dict
from .task_queue import pop


def run_next_task() -> dict[str, Any] | None:
    task_dict = pop()
    if not task_dict:
        return None
    task = task_from_dict(task_dict)
    result = {"task_id": task.task_id, "action": task.action, "status": "ok", "result": {}}
    if task.action == "create_page":
        try:
            from ..agents.integration_agent import create_or_update
            payload = task.payload
            out = create_or_update(
                payload.get("space_key", ""),
                payload.get("title", ""),
                payload.get("content_blocks", []),
                payload.get("mode", "create"),
                payload.get("parent_page_id"),
            )
            result["result"] = out
            if out.get("status") == "error":
                result["status"] = "error"
        except Exception as e:
            result["status"] = "error"
            result["result"] = {"error": str(e)}
    else:
        result["result"] = {"message": "unknown action"}
    return result

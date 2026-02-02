"""Task dataclass + payload schema for Confluence MCP tasks."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class ConfluenceTask:
    task_id: str
    action: str
    payload: dict[str, Any]


def task_from_dict(data: dict) -> ConfluenceTask:
    return ConfluenceTask(
        task_id=data.get("task_id", ""),
        action=data.get("action", ""),
        payload=data.get("payload", {}),
    )


def task_to_dict(t: ConfluenceTask) -> dict:
    return {"task_id": t.task_id, "action": t.action, "payload": t.payload}

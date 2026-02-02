"""MCP server: task queue, confluence tasks, orchestrator, health, state tracker."""
from __future__ import annotations

from .confluence_tasks import ConfluenceTask, task_from_dict, task_to_dict
from .health_monitor import get_last_error, health_status, queue_size, set_last_error
from .orchestrator import run_next_task
from .state_tracker import record_transition
from .task_queue import load_persisted, pop, push, size

__all__ = [
    "ConfluenceTask",
    "task_from_dict",
    "task_to_dict",
    "push",
    "pop",
    "size",
    "load_persisted",
    "run_next_task",
    "queue_size",
    "get_last_error",
    "set_last_error",
    "health_status",
    "record_transition",
]

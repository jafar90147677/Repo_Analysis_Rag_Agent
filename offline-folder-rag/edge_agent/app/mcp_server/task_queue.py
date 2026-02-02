"""In-memory task queue + optional persistence to state_files/.../task_queue_state.json."""
from __future__ import annotations

import json
from collections import deque
from pathlib import Path
from typing import Any

_QUEUE: deque[dict] | None = None
_STATE_PATH = Path(__file__).resolve().parents[4] / "state_files" / "mcp" / "task_queue_state.json"


def _queue() -> deque:
    global _QUEUE
    if _QUEUE is None:
        _QUEUE = deque()
    return _QUEUE


def push(task: dict[str, Any]) -> None:
    _queue().append(task)
    _persist()


def pop() -> dict | None:
    q = _queue()
    if not q:
        return None
    task = q.popleft()
    _persist()
    return task


def size() -> int:
    return len(_queue())


def _persist() -> None:
    _STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    try:
        with open(_STATE_PATH, "w", encoding="utf-8") as f:
            json.dump(list(_queue()), f, indent=2)
    except OSError:
        pass


def load_persisted() -> None:
    if _STATE_PATH.exists():
        try:
            with open(_STATE_PATH, encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list):
                _queue().clear()
                _queue().extend(data)
        except (json.JSONDecodeError, OSError):
            pass

"""Queue size + last error (in-memory)."""
from __future__ import annotations

from .task_queue import size

_LAST_ERROR: str | None = None


def queue_size() -> int:
    return size()


def set_last_error(msg: str) -> None:
    global _LAST_ERROR
    _LAST_ERROR = msg


def get_last_error() -> str | None:
    return _LAST_ERROR


def health_status() -> dict:
    return {"queue_size": queue_size(), "last_error": get_last_error()}

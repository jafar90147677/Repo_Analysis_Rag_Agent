"""Minimal state machine: INIT -> ANALYSED -> FORMATTED -> SUBMITTED -> DONE | FAILED."""
from __future__ import annotations

from pathlib import Path
from typing import Any

from .utils import ensure_dir, safe_json_read, safe_json_write

STATES = ("INIT", "ANALYSED", "FORMATTED", "SUBMITTED", "DONE", "FAILED")
_STATE_DIR: Path | None = None


def _state_dir() -> Path:
    global _STATE_DIR
    if _STATE_DIR is None:
        base = Path(__file__).resolve().parents[4]
        _STATE_DIR = base / "state_files" / "confluence_states" / "creation_sessions"
    return _STATE_DIR


def get_session_path(session_id: str) -> Path:
    return _state_dir() / f"{session_id}.json"


def get_state(session_id: str) -> str:
    p = get_session_path(session_id)
    data = safe_json_read(p, default={})
    return data.get("state", "INIT") if isinstance(data, dict) else "INIT"


def set_state(session_id: str, state: str, extra: dict[str, Any] | None = None) -> None:
    if state not in STATES:
        return
    p = get_session_path(session_id)
    ensure_dir(p.parent)
    data = safe_json_read(p, default={})
    if not isinstance(data, dict):
        data = {}
    data["state"] = state
    if extra:
        data.update(extra)
    safe_json_write(p, data)


def transition(session_id: str, from_state: str, to_state: str) -> bool:
    current = get_state(session_id)
    if current != from_state:
        return False
    if to_state not in STATES:
        return False
    set_state(session_id, to_state)
    return True

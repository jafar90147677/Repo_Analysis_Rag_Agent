"""Write task state transitions to confluence_data/logs/states/mcp_states/."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_BASE = Path(__file__).resolve().parents[4] / "confluence_data" / "logs" / "states" / "mcp_states"


def record_transition(task_id: str, from_state: str, to_state: str, extra: dict[str, Any] | None = None) -> None:
    _BASE.mkdir(parents=True, exist_ok=True)
    path = _BASE / f"{task_id}.json"
    data = {"task_id": task_id, "from_state": from_state, "to_state": to_state}
    if extra:
        data.update(extra)
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except OSError:
        pass

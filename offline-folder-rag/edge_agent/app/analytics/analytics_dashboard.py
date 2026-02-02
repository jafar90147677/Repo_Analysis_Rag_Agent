"""Minimal class that reads stored counters and returns JSON for UI."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_LOG_PATH = Path(__file__).resolve().parents[4] / "logs" / "confluence" / "agent_execution.log"


def get_dashboard_json() -> dict[str, Any]:
    """Read counters from log (stub: return summary structure)."""
    out = {"operations": [], "total_operations": 0}
    if _LOG_PATH.exists():
        try:
            with open(_LOG_PATH, encoding="utf-8") as f:
                lines = f.readlines()
            out["total_operations"] = len(lines)
            out["operations"] = [{"line": i + 1} for i in range(min(100, len(lines)))]
        except OSError:
            pass
    return out

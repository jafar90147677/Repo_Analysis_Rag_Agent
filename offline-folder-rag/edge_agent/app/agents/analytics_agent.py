"""Stub: count operations; write to logs/confluence/agent_execution.log."""
from __future__ import annotations

import logging
from pathlib import Path

_LOG_PATH: Path | None = None


def _log_path() -> Path:
    global _LOG_PATH
    if _LOG_PATH is None:
        _LOG_PATH = Path(__file__).resolve().parents[4] / "logs" / "confluence" / "agent_execution.log"
    _LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    return _LOG_PATH


def log_operation(agent_name: str, operation: str, count: int = 1) -> None:
    logger = logging.getLogger("edge_agent.analytics")
    if not logger.handlers:
        h = logging.FileHandler(_log_path(), encoding="utf-8")
        h.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(message)s"))
        logger.addHandler(h)
    logger.info("%s %s count=%s", agent_name, operation, count)

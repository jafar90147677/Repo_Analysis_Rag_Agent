"""Confluence-specific logger writing to logs/confluence/confluence_app.log."""
from __future__ import annotations

import logging
from pathlib import Path

_CONFLUENCE_LOG_DIR: Path | None = None
_CONFLUENCE_LOGGER: logging.Logger | None = None


def _ensure_log_dir() -> Path:
    global _CONFLUENCE_LOG_DIR
    if _CONFLUENCE_LOG_DIR is None:
        base = Path(__file__).resolve().parents[4]
        _CONFLUENCE_LOG_DIR = base / "logs" / "confluence"
    _CONFLUENCE_LOG_DIR.mkdir(parents=True, exist_ok=True)
    return _CONFLUENCE_LOG_DIR


def get_confluence_logger() -> logging.Logger:
    """Return a configured logger for Confluence; dirs created lazily at first use."""
    global _CONFLUENCE_LOGGER
    if _CONFLUENCE_LOGGER is not None:
        return _CONFLUENCE_LOGGER
    log_dir = _ensure_log_dir()
    log_file = log_dir / "confluence_app.log"
    logger = logging.getLogger("edge_agent.confluence")
    logger.setLevel(logging.INFO)
    if not logger.handlers:
        fh = logging.FileHandler(log_file, encoding="utf-8")
        fh.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
        logger.addHandler(fh)
        sh = logging.StreamHandler()
        sh.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
        logger.addHandler(sh)
    _CONFLUENCE_LOGGER = logger
    return logger

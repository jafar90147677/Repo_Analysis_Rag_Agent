"""Load confluence_data/config/spaces_config.json; get_default_space, is_space_allowed."""
from __future__ import annotations

from pathlib import Path
from typing import Any

from .utils import safe_json_read

_SPACES_CONFIG_PATH: Path | None = None


def _spaces_config_path() -> Path:
    global _SPACES_CONFIG_PATH
    if _SPACES_CONFIG_PATH is None:
        base = Path(__file__).resolve().parents[4]
        _SPACES_CONFIG_PATH = base / "confluence_data" / "config" / "spaces_config.json"
    return _SPACES_CONFIG_PATH


def get_default_space() -> str:
    data = safe_json_read(_spaces_config_path(), default={})
    if isinstance(data, dict):
        return data.get("default_space") or ""
    return ""


def is_space_allowed(space_key: str) -> bool:
    data = safe_json_read(_spaces_config_path(), default={})
    if not isinstance(data, dict):
        return True
    allowed = data.get("allowed_spaces")
    if allowed is None:
        return True
    if isinstance(allowed, list):
        return space_key in allowed
    return True

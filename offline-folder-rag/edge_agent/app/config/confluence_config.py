"""Confluence settings loaded from env and optional default_config.json."""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

_CONFLUENCE_DATA_CONFIG = Path(__file__).resolve().parents[4] / "confluence_data" / "config" / "default_config.json"


def _load_default_json_if_present() -> dict[str, Any]:
    if _CONFLUENCE_DATA_CONFIG.exists():
        try:
            with open(_CONFLUENCE_DATA_CONFIG, encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            pass
    return {}


class ConfluenceSettings:
    """Confluence connection settings (env + optional default_config.json)."""

    def __init__(
        self,
        base_url: str = "",
        user_email: str = "",
        api_token: str = "",
        bearer_token: str = "",
        default_space: str = "",
        timeout_seconds: int = 20,
        verify_ssl: bool = True,
    ):
        defaults = _load_default_json_if_present()
        self.CONFLUENCE_BASE_URL = (
            base_url or os.environ.get("CONFLUENCE_BASE_URL") or defaults.get("CONFLUENCE_BASE_URL", "")
        )
        self.CONFLUENCE_USER_EMAIL = (
            user_email or os.environ.get("CONFLUENCE_USER_EMAIL") or defaults.get("CONFLUENCE_USER_EMAIL", "")
        )
        self.CONFLUENCE_API_TOKEN = (
            api_token or os.environ.get("CONFLUENCE_API_TOKEN") or defaults.get("CONFLUENCE_API_TOKEN", "")
        )
        self.CONFLUENCE_BEARER_TOKEN = (
            bearer_token or os.environ.get("CONFLUENCE_BEARER_TOKEN") or defaults.get("CONFLUENCE_BEARER_TOKEN", "")
        )
        self.CONFLUENCE_DEFAULT_SPACE = (
            default_space or os.environ.get("CONFLUENCE_DEFAULT_SPACE") or defaults.get("CONFLUENCE_DEFAULT_SPACE", "")
        )
        self.CONFLUENCE_TIMEOUT_SECONDS = timeout_seconds or int(
            os.environ.get("CONFLUENCE_TIMEOUT_SECONDS", defaults.get("CONFLUENCE_TIMEOUT_SECONDS", 20))
        )
        self.CONFLUENCE_VERIFY_SSL = verify_ssl
        env_verify = os.environ.get("CONFLUENCE_VERIFY_SSL", "").lower()
        if env_verify in ("0", "false", "no"):
            self.CONFLUENCE_VERIFY_SSL = False

    def is_configured(self) -> bool:
        """True if base_url and some auth (api_token or bearer_token) are set."""
        has_url = bool(self.CONFLUENCE_BASE_URL and self.CONFLUENCE_BASE_URL.strip())
        has_auth = bool(self.CONFLUENCE_BEARER_TOKEN or (self.CONFLUENCE_USER_EMAIL and self.CONFLUENCE_API_TOKEN))
        return has_url and has_auth

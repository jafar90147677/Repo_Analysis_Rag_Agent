"""Write starter config JSON if missing and validate env vars (safe, no destructive ops)."""
from __future__ import annotations

import json
import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CONFIG_DIR = REPO_ROOT / "confluence_data" / "config"
DEFAULT_CONFIG = CONFIG_DIR / "default_config.json"


def main() -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    if not DEFAULT_CONFIG.exists():
        starter = {
            "CONFLUENCE_BASE_URL": os.environ.get("CONFLUENCE_BASE_URL", ""),
            "CONFLUENCE_DEFAULT_SPACE": os.environ.get("CONFLUENCE_DEFAULT_SPACE", ""),
        }
        with open(DEFAULT_CONFIG, "w", encoding="utf-8") as f:
            json.dump(starter, f, indent=2)
    # Validate env (no secrets printed)
    base_url = os.environ.get("CONFLUENCE_BASE_URL", "")
    has_auth = bool(os.environ.get("CONFLUENCE_BEARER_TOKEN") or (os.environ.get("CONFLUENCE_USER_EMAIL") and os.environ.get("CONFLUENCE_API_TOKEN")))
    print("CONFLUENCE_BASE_URL set:", bool(base_url))
    print("Auth configured:", has_auth)


if __name__ == "__main__":
    main()

"""Stub: record successful template to JSON (no ML)."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_BASE = Path(__file__).resolve().parents[4] / "confluence_data" / "examples" / "successful_creations"


def record_successful_template(template_name: str, metadata: dict[str, Any]) -> None:
    path = _BASE / "successful_templates.jsonl"
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps({"template": template_name, "metadata": metadata}) + "\n")

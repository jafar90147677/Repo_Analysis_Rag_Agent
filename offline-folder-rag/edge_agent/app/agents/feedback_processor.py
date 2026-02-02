"""Accept feedback payload; store to confluence_data/examples/successful_creations/feedback.jsonl."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_PATH = Path(__file__).resolve().parents[4] / "confluence_data" / "examples" / "successful_creations" / "feedback.jsonl"


def process_feedback(payload: dict[str, Any]) -> None:
    _PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(payload) + "\n")

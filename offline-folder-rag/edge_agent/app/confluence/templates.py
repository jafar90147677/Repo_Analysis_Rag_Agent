"""Template manager: loads JSON from confluence_data/templates/*.json."""
from __future__ import annotations

from pathlib import Path
from typing import Any

from .utils import safe_json_read

_TEMPLATES_DIR: Path | None = None


def _templates_dir() -> Path:
    global _TEMPLATES_DIR
    if _TEMPLATES_DIR is None:
        base = Path(__file__).resolve().parents[4]
        _TEMPLATES_DIR = base / "confluence_data" / "templates"
    return _TEMPLATES_DIR


def list_templates() -> list[str]:
    d = _templates_dir()
    if not d.exists():
        return []
    names = []
    for f in d.glob("*.json"):
        names.append(f.stem)
    return sorted(names)


def get_template(name: str) -> dict[str, Any] | None:
    d = _templates_dir()
    path = d / f"{name}.json"
    if not path.exists():
        return None
    data = safe_json_read(path)
    return data if isinstance(data, dict) else None


def select_template(metadata: dict[str, Any]) -> str | None:
    """Simple deterministic template selection from metadata."""
    kind = (metadata.get("kind") or metadata.get("type") or "").lower()
    templates = list_templates()
    if not templates:
        return None
    mapping = {
        "python": "python_api_template",
        "api": "python_api_template",
        "web": "web_app_template",
        "web_app": "web_app_template",
        "config": "config_template",
        "database": "database_template",
        "db": "database_template",
        "mixed": "mixed_project_template",
        "library": "library_template",
        "testing": "testing_template",
        "test": "testing_template",
    }
    chosen = mapping.get(kind)
    if chosen and f"{chosen}.json" in [t + ".json" for t in templates]:
        return chosen
    return templates[0] if templates else None

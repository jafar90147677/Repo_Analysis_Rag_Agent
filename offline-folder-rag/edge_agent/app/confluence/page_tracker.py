"""Persist page metadata to local JSON (confluence_data/examples/successful_creations/page_tracker.json)."""
from __future__ import annotations

from pathlib import Path
from typing import Any

from .utils import ensure_dir, safe_json_read, safe_json_write

_DEFAULT_PATH: Path | None = None


def _default_path() -> Path:
    global _DEFAULT_PATH
    if _DEFAULT_PATH is None:
        base = Path(__file__).resolve().parents[4]
        _DEFAULT_PATH = base / "confluence_data" / "examples" / "successful_creations" / "page_tracker.json"
    return _DEFAULT_PATH


def record_page(
    repo_id: str,
    file_path: str,
    page_id: str,
    url: str,
    space_key: str,
    title: str,
    path: Path | None = None,
) -> None:
    p = path or _default_path()
    ensure_dir(p.parent)
    data = safe_json_read(p, default=[])
    if not isinstance(data, list):
        data = []
    entry = {
        "repo_id": repo_id,
        "file_path": file_path,
        "page_id": page_id,
        "url": url,
        "space_key": space_key,
        "title": title,
    }
    data = [e for e in data if not (e.get("repo_id") == repo_id and e.get("file_path") == file_path)]
    data.append(entry)
    safe_json_write(p, data)


def get_page(repo_id: str, file_path: str, path: Path | None = None) -> dict[str, Any] | None:
    p = path or _default_path()
    data = safe_json_read(p, default=[])
    if not isinstance(data, list):
        return None
    for e in data:
        if e.get("repo_id") == repo_id and e.get("file_path") == file_path:
            return e
    return None

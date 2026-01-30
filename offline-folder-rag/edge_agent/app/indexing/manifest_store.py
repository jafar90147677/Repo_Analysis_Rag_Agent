from __future__ import annotations

import json
from pathlib import Path
from typing import Any

SKIP_REASON_CHUNK_LIMIT = "CHUNK_LIMIT"
_FILES_KEY = "files"


def _ensure_files_section(data: dict[str, Any]) -> dict[str, Any]:
    if _FILES_KEY not in data or not isinstance(data[_FILES_KEY], dict):
        data[_FILES_KEY] = {}
    return data


def _load_manifest(path: Path) -> dict[str, Any]:
    try:
        raw = path.read_text(encoding="utf-8")
        data = json.loads(raw)
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return {_FILES_KEY: {}}
    return _ensure_files_section(data)


def _write_manifest(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def record_file_truncation(
    manifest_path: Path | str,
    file_path: Path | str,
    skip_reason: str = SKIP_REASON_CHUNK_LIMIT,
) -> None:
    if not manifest_path:
        return

    manifest_file = Path(manifest_path)
    manifest_data = _load_manifest(manifest_file)
    files = manifest_data.setdefault(_FILES_KEY, {})
    entry = files.get(str(file_path), {})
    entry.update({"truncated": True, "skip_reason": skip_reason})
    files[str(file_path)] = entry
    _write_manifest(manifest_file, manifest_data)


__all__ = [
    "SKIP_REASON_CHUNK_LIMIT",
    "record_file_truncation",
]

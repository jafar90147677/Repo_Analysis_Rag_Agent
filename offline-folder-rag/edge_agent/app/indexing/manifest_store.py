from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Dict, Any, List

SKIP_REASON_CHUNK_LIMIT = "CHUNK_LIMIT"
_FILES_KEY = "files"

class ManifestStore:
    """
    Handles persistence of indexing metadata (manifest.json).
    """
    
    # Skip reason constants
    EXCLUDED_DIR = "EXCLUDED_DIR"
    EXCLUDED_EXT = "EXCLUDED_EXT"
    SYMLINK = "SYMLINK"
    SIZE_CAP = "SIZE_CAP"
    BINARY = "BINARY"
    ENCODING_ERROR = "ENCODING_ERROR"
    CHUNK_LIMIT = SKIP_REASON_CHUNK_LIMIT
    OTHER = "OTHER"

    def __init__(self, manifest_path: str):
        self.manifest_path = Path(manifest_path)
        self.entries: List[Dict[str, Any]] = []

    def add_entry(self, path: str, status: str, skip_reason: str = None, encoding: str = None, mtime_epoch_ms: int = None, indexed_at_epoch_ms: int = None):
        """Add a record to the manifest."""
        entry = {
            "path": path,
            "status": status
        }
        if skip_reason:
            entry["skip_reason"] = skip_reason
        if encoding:
            entry["encoding"] = encoding
        if mtime_epoch_ms is not None:
            entry["mtime_epoch_ms"] = mtime_epoch_ms
        if indexed_at_epoch_ms is not None:
            entry["indexed_at_epoch_ms"] = indexed_at_epoch_ms
        self.entries.append(entry)

    def add_or_update_entry(self, path: str, status: str, skip_reason: str = None, encoding: str = None, mtime_epoch_ms: int = None, indexed_at_epoch_ms: int = None):
        """Add or update a record in the manifest."""
        for entry in self.entries:
            if entry["path"] == path:
                entry["status"] = status
                if skip_reason:
                    entry["skip_reason"] = skip_reason
                else:
                    entry.pop("skip_reason", None)
                if encoding:
                    entry["encoding"] = encoding
                if mtime_epoch_ms is not None:
                    entry["mtime_epoch_ms"] = mtime_epoch_ms
                if indexed_at_epoch_ms is not None:
                    entry["indexed_at_epoch_ms"] = indexed_at_epoch_ms
                return
        
        self.add_entry(path, status, skip_reason, encoding, mtime_epoch_ms, indexed_at_epoch_ms)

    def add_symlink_entry(self, path: str):
        """Record a skipped symlink entry."""
        self.add_entry(path, status="SKIPPED", skip_reason=self.SYMLINK)

    def save(self):
        """Save entries to manifest.json."""
        self.manifest_path.parent.mkdir(parents=True, exist_ok=True)
        # Load existing manifest to merge if needed, or just overwrite if that's the current behavior
        # The current ManifestStore.save() overwrites. Let's keep it consistent but add a way to merge chunk limit info.
        data = {"entries": self.entries}
        with open(self.manifest_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)


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
    "ManifestStore",
    "SKIP_REASON_CHUNK_LIMIT",
    "record_file_truncation",
]

import json
import os
from pathlib import Path
from typing import Dict, Any, List

class ManifestStore:
    """
    Handles persistence of indexing metadata (manifest.json).
    """
    
    # Skip reason constants
    EXCLUDED_DIR = "EXCLUDED_DIR"
    EXCLUDED_EXT = "EXCLUDED_EXT"
    SYMLINK = "SYMLINK"
    SIZE_EXCEEDED = "SIZE_EXCEEDED"
    BINARY = "BINARY"
    ENCODING_ERROR = "ENCODING_ERROR"
    CHUNK_LIMIT = "CHUNK_LIMIT"

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

    def add_symlink_entry(self, path: str):
        """Record a skipped symlink entry."""
        self.add_entry(path, status="SKIPPED", skip_reason=self.SYMLINK)

    def save(self):
        """Save entries to manifest.json."""
        self.manifest_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.manifest_path, "w", encoding="utf-8") as f:
            json.dump({"entries": self.entries}, f, indent=2)

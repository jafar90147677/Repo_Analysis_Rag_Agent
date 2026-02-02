"""Deterministically classify input blocks; output metadata dict."""
from __future__ import annotations

from typing import Any


def analyse_blocks(blocks: list[dict]) -> dict[str, Any]:
    """Classify blocks and return metadata (no network, deterministic)."""
    metadata = {"block_count": len(blocks), "types": [], "has_code": False, "has_text": False}
    for b in blocks:
        t = (b.get("type") or "text").lower()
        if t not in metadata["types"]:
            metadata["types"].append(t)
        if t == "code":
            metadata["has_code"] = True
        if t == "text":
            metadata["has_text"] = True
    metadata["kind"] = "mixed" if (metadata["has_code"] and metadata["has_text"]) else ("code" if metadata["has_code"] else "text")
    return metadata

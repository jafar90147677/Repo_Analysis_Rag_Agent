"""Uses formatter to convert blocks to Confluence storage."""
from __future__ import annotations

from ..confluence.formatter import blocks_to_storage


def format_blocks(blocks: list[dict]) -> str:
    """Return Confluence storage (XHTML) for blocks."""
    return blocks_to_storage(blocks)

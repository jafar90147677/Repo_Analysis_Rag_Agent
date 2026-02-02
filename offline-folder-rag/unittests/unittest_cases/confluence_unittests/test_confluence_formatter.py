"""Confluence formatter unit tests (deterministic)."""
import pytest
from edge_agent.app.confluence.formatter import blocks_to_storage


def test_blocks_to_storage_text():
    out = blocks_to_storage([{"type": "text", "content": "Hello"}])
    assert "<p>" in out
    assert "Hello" in out


def test_blocks_to_storage_code():
    out = blocks_to_storage([{"type": "code", "content": "x=1", "language": "python"}])
    assert "ac:structured-macro" in out
    assert "code" in out
    assert "x=1" in out


def test_blocks_to_storage_empty():
    out = blocks_to_storage([])
    assert "<p>" in out or len(out) > 0

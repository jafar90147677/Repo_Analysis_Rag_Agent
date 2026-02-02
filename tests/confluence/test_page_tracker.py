"""Page tracker read/write tests (no network)."""
import tempfile
from pathlib import Path

import pytest


def test_page_tracker_record_and_get(tmp_path):
    from edge_agent.app.confluence import page_tracker
    orig = page_tracker._DEFAULT_PATH
    try:
        p = tmp_path / "tracker.json"
        page_tracker._DEFAULT_PATH = p
        page_tracker.record_page("repo1", "foo/bar.md", "123", "https://example.com/123", "SPACE", "Title")
        entry = page_tracker.get_page("repo1", "foo/bar.md")
        assert entry is not None
        assert entry["page_id"] == "123"
        assert entry["title"] == "Title"
        assert page_tracker.get_page("repo2", "x") is None
    finally:
        page_tracker._DEFAULT_PATH = orig

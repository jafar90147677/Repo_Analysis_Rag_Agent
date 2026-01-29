import pytest
import sys
import logging
from pathlib import Path

# Add edge-agent to sys.path
repo_root = Path(__file__).resolve().parents[3]
edge_agent_path = str(repo_root / "offline-folder-rag" / "edge-agent")
if edge_agent_path not in sys.path:
    sys.path.insert(0, edge_agent_path)

from app.logging.logger import TokenFilter # type: ignore

def test_token_filter_non_string_msg():
    filter = TokenFilter()
    # Create a dummy log record with a non-string message (e.g., a dict or list)
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="test.py",
        lineno=1,
        msg={"key": "value"},
        args=(),
        exc_info=None
    )
    # The filter should handle non-string msgs without error and return True
    assert filter.filter(record) is True
    assert record.msg == {"key": "value"}

"""State machine transition tests (deterministic, no network)."""
import tempfile
from pathlib import Path

import pytest


def test_state_machine_transition(tmp_path):
    from edge_agent.app.confluence import state_machine
    orig_dir = state_machine._STATE_DIR
    try:
        state_machine._STATE_DIR = tmp_path / "sessions"
        sid = "test-session-001"
        assert state_machine.get_state(sid) == "INIT"
        state_machine.set_state(sid, "ANALYSED")
        assert state_machine.get_state(sid) == "ANALYSED"
        assert state_machine.transition(sid, "ANALYSED", "FORMATTED") is True
        assert state_machine.get_state(sid) == "FORMATTED"
        assert state_machine.transition(sid, "INIT", "DONE") is False
        assert state_machine.get_state(sid) == "FORMATTED"
    finally:
        state_machine._STATE_DIR = orig_dir

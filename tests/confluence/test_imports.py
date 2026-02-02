"""Import tests for Confluence modules (no network)."""
import pytest


def test_import_confluence_client():
    from edge_agent.app.confluence.client import ConfluenceClient
    assert ConfluenceClient is not None


def test_import_confluence_formatter():
    from edge_agent.app.confluence.formatter import blocks_to_storage
    assert callable(blocks_to_storage)


def test_import_confluence_templates():
    from edge_agent.app.confluence.templates import list_templates, get_template
    assert callable(list_templates)
    assert callable(get_template)


def test_import_confluence_state_machine():
    from edge_agent.app.confluence.state_machine import get_state, set_state, transition, STATES
    assert "INIT" in STATES
    assert callable(get_state)
    assert callable(set_state)
    assert callable(transition)


def test_import_confluence_page_tracker():
    from edge_agent.app.confluence.page_tracker import record_page, get_page
    assert callable(record_page)
    assert callable(get_page)


def test_import_confluence_routes():
    from edge_agent.app.api.confluence_routes import router
    assert router is not None

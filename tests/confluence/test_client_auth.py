"""Confluence client auth selection test (no network)."""
import pytest


def test_client_auth_bearer():
    from edge_agent.app.config.confluence_config import ConfluenceSettings
    from edge_agent.app.confluence.client import ConfluenceClient
    settings = ConfluenceSettings(base_url="https://example.com", bearer_token="BearerSettings")
    settings.CONFLUENCE_BEARER_TOKEN = "secret"
    settings.CONFLUENCE_USER_EMAIL = ""
    settings.CONFLUENCE_API_TOKEN = ""
    client = ConfluenceClient(settings)
    session = client._get_session()
    assert "Authorization" in session.headers
    assert session.headers["Authorization"].startswith("Bearer ")


def test_client_auth_basic():
    from edge_agent.app.config.confluence_config import ConfluenceSettings
    from edge_agent.app.confluence.client import ConfluenceClient
    settings = ConfluenceSettings(base_url="https://example.com")
    settings.CONFLUENCE_BEARER_TOKEN = ""
    settings.CONFLUENCE_USER_EMAIL = "u@e.com"
    settings.CONFLUENCE_API_TOKEN = "tok"
    client = ConfluenceClient(settings)
    session = client._get_session()
    assert "Authorization" in session.headers
    assert session.headers["Authorization"].startswith("Basic ")

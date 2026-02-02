"""API router mounts test (FastAPI TestClient, no external Confluence)."""
import pytest
from fastapi.testclient import TestClient

from edge_agent.app.main import app


def test_confluence_router_mounted():
    client = TestClient(app)
    # Confluence routes require X-LOCAL-TOKEN; expect 401 without it
    r = client.get("/confluence/health")
    assert r.status_code == 401
    # With token from env/storage, would be 200
    from edge_agent.app.security.token_store import get_or_create_token
    token = get_or_create_token()
    r2 = client.get("/confluence/health", headers={"X-LOCAL-TOKEN": token})
    assert r2.status_code == 200
    data = r2.json()
    assert "status" in data
    assert "config_present" in data

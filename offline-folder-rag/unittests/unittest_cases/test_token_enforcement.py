import pytest
from fastapi.testclient import TestClient
import importlib
import sys
from pathlib import Path

def _load_app():
    repo_root = Path(__file__).resolve().parents[2]
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))
    app_module = importlib.import_module("edge_agent.app.main")
    return app_module.app

@pytest.fixture
def client():
    return TestClient(_load_app())

def test_health_endpoint_invalid_token(client):
    response = client.get("/health")
    assert response.status_code == 401
    assert response.json() == {
        "error_code": "INVALID_TOKEN",
        "message": "The provided token is missing or invalid.",
        "remediation": "Please provide a valid X-LOCAL-TOKEN in the request headers.",
    }

def test_ask_endpoint_invalid_token(client):
    data = {"query": "What is the repo status?"}
    response = client.post("/ask", json=data)
    assert response.status_code == 401
    assert response.json() == {
        "error_code": "INVALID_TOKEN",
        "message": "The provided token is missing or invalid.",
        "remediation": "Please provide a valid X-LOCAL-TOKEN in the request headers.",
    }

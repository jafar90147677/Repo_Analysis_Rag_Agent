import pytest
import sys
from pathlib import Path
from fastapi.testclient import TestClient

repo_root = Path(__file__).resolve().parents[3]
project_root = repo_root / "offline-folder-rag"
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from edge_agent.app.main import app  # type: ignore
from edge_agent.app.security.token_store import get_or_create_token  # type: ignore

client = TestClient(app)


def test_health_endpoint_invalid_token():
    response = client.get("/health")
    assert response.status_code == 401
    assert response.json() == {
        "error_code": "INVALID_TOKEN",
        "message": "The provided token is missing or invalid.",
        "remediation": "Please provide a valid X-LOCAL-TOKEN in the request headers.",
    }


def test_ask_endpoint_invalid_token():
    data = {"query": "What is the repo status?"}
    response = client.post("/ask", json=data)
    assert response.status_code == 401
    assert response.json() == {
        "error_code": "INVALID_TOKEN",
        "message": "The provided token is missing or invalid.",
        "remediation": "Please provide a valid X-LOCAL-TOKEN in the request headers.",
    }

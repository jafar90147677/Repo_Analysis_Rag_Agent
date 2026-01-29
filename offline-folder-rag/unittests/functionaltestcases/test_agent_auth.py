import pytest
import sys
import os
from pathlib import Path

# Add edge-agent to sys.path to resolve 'app' module
repo_root = Path(__file__).resolve().parents[3]
edge_agent_path = str(repo_root / "offline-folder-rag" / "edge-agent")
if edge_agent_path not in sys.path:
    sys.path.insert(0, edge_agent_path)

# Ensure 'app' is importable from the edge-agent directory
app_path = str(repo_root / "offline-folder-rag" / "edge-agent")
if app_path not in sys.path:
    sys.path.insert(0, app_path)

from fastapi.testclient import TestClient
from app.main import app  # type: ignore
from app.security.token_store import get_or_create_token  # type: ignore

client = TestClient(app)

@pytest.fixture
def auth_token():
    return get_or_create_token()

def test_health_endpoint_auth(auth_token):
    # Valid token
    response = client.get("/health", headers={"X-LOCAL-TOKEN": auth_token})
    assert response.status_code == 200
    assert response.json() == {
        "indexing": False,
        "indexed_files_so_far": 0,
        "estimated_total_files": 0,
        "last_index_completed_epoch_ms": 0,
        "ollama_ok": True,
        "ripgrep_ok": True,
        "chroma_ok": True
    }

    # Invalid token
    response = client.get("/health", headers={"X-LOCAL-TOKEN": "wrong_token"})
    assert response.status_code == 401
    assert response.json()["error_code"] == "INVALID_TOKEN"

    # Missing token
    response = client.get("/health")
    assert response.status_code == 401
    assert response.json()["error_code"] == "INVALID_TOKEN"

def test_index_endpoint_auth(auth_token):
    # Valid token
    response = client.post(
        "/index", 
        headers={"X-LOCAL-TOKEN": auth_token},
        json={"root_path": "/path/to/repo"}
    )
    assert response.status_code == 200
    assert response.json() == {
        "repo_id": "placeholder-repo-id",
        "mode": "full",
        "indexed_files": 0,
        "skipped_files": 0,
        "chunks_added": 0,
        "duration_ms": 0
    }

    # Invalid token
    response = client.post("/index", headers={"X-LOCAL-TOKEN": "wrong_token"})
    assert response.status_code == 401
    assert response.json()["error_code"] == "INVALID_TOKEN"

def test_ask_endpoint_auth(auth_token):
    # Valid token
    response = client.post(
        "/ask", 
        headers={"X-LOCAL-TOKEN": auth_token},
        json={"query": "test query"}
    )
    assert response.status_code == 200
    assert response.json() == {
        "mode": "rag",
        "confidence": "high",
        "answer": "This is a placeholder answer",
        "citations": []
    }

    # Invalid token
    response = client.post(
        "/ask", 
        headers={"X-LOCAL-TOKEN": "wrong_token"},
        json={"query": "test query"}
    )
    assert response.status_code == 401
    assert response.json()["error_code"] == "INVALID_TOKEN"

import pytest
import sys
import os
from pathlib import Path

repo_root = Path(__file__).resolve().parents[3]
project_root = repo_root / "offline-folder-rag"
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from fastapi.testclient import TestClient
from edge_agent.app.main import app  # type: ignore
from edge_agent.app.security.token_store import get_or_create_token  # type: ignore
from edge_agent.app.indexing.indexer import reset_indexing_stats
from unittest.mock import patch

client = TestClient(app)

@pytest.fixture
def auth_token():
    return get_or_create_token()

def test_health_endpoint_auth(auth_token):
    # Reset state to ensure clean test
    reset_indexing_stats()
    
    # Valid token
    with patch("edge_agent.app.api.routes.check_ollama", return_value=True), \
         patch("edge_agent.app.api.routes.check_ripgrep", return_value=True), \
         patch("edge_agent.app.api.routes.check_chroma", return_value=True):
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
    root_path = "/path/to/repo"
    response = client.post(
        "/index", 
        headers={"X-LOCAL-TOKEN": auth_token},
        json={"root_path": root_path}
    )
    assert response.status_code == 200
    
    # The repo_id is now computed using SHA256 of the normalized path.
    # We check if it exists and is a hex string of correct length.
    data = response.json()
    assert "repo_id" in data
    assert len(data["repo_id"]) == 64
    assert data["mode"] == "full"
    assert data["indexed_files"] == 0

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

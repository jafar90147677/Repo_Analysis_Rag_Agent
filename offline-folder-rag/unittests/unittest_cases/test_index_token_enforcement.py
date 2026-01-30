import importlib
import sys
from pathlib import Path

from fastapi.testclient import TestClient

from edge_agent.app.api.routes import compute_repo_id
from edge_agent.app.indexing.indexer import is_indexing_in_progress
from edge_agent.app.security import TOKEN_HEADER, get_or_create_token


def _load_fastapi_app():
    repo_root = Path(__file__).resolve().parents[1]
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))
    module = importlib.import_module("edge_agent.app.main")
    return module.app


def _index_request(client: TestClient, repo_path: Path, headers: dict | None):
    payload = {"root_path": str(repo_path)}
    return client.post("/index", json=payload, headers=headers or {})


def _assert_invalid_token_response(response):
    assert response.status_code == 401
    body = response.json()
    assert body["error_code"] == "INVALID_TOKEN"
    assert "message" in body
    assert "remediation" in body


def test_index_rejects_missing_token(tmp_path, monkeypatch):
    monkeypatch.setenv("RAG_INDEX_DIR", str(tmp_path))
    app = _load_fastapi_app()
    client = TestClient(app)

    repo_path = tmp_path / "repo"
    repo_path.mkdir()

    response = _index_request(client, repo_path, headers=None)
    _assert_invalid_token_response(response)

    repo_id = compute_repo_id(str(repo_path))
    assert not is_indexing_in_progress(repo_id)


def test_index_rejects_invalid_token(tmp_path, monkeypatch):
    monkeypatch.setenv("RAG_INDEX_DIR", str(tmp_path))
    app = _load_fastapi_app()
    client = TestClient(app)

    repo_path = tmp_path / "repo"
    repo_path.mkdir()

    response = _index_request(client, repo_path, headers={TOKEN_HEADER: "bogus"})
    _assert_invalid_token_response(response)

    repo_id = compute_repo_id(str(repo_path))
    assert not is_indexing_in_progress(repo_id)

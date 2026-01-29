import importlib.util
import os
import sys
from pathlib import Path

from fastapi.testclient import TestClient


def _load_main_module():
    repo_root = Path(__file__).resolve().parents[3]
    edge_agent_root = repo_root / "edge-agent"
    sys.path.insert(0, str(edge_agent_root))
    main_path = repo_root / "edge-agent" / "app" / "main.py"
    spec = importlib.util.spec_from_file_location("edge_agent_main", main_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _load_token_store():
    repo_root = Path(__file__).resolve().parents[3]
    token_store_path = repo_root / "edge-agent" / "app" / "security" / "token_store.py"
    spec = importlib.util.spec_from_file_location("token_store", token_store_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_health_requires_token(tmp_path, monkeypatch):
    monkeypatch.setenv("RAG_INDEX_DIR", str(tmp_path))
    module = _load_main_module()
    app = module.create_app()
    client = TestClient(app)

    response = client.get("/health")
    assert response.status_code == 401
    assert response.json()["error_code"] == "INVALID_TOKEN"

    token_file = tmp_path / "agent_token.txt"
    token = token_file.read_text(encoding="utf-8").strip()
    response_ok = client.get("/health", headers={"X-LOCAL-TOKEN": token})
    assert response_ok.status_code == 200
    assert response_ok.json() == {"status": "ok"}


def test_token_creation_and_reuse(tmp_path, monkeypatch):
    monkeypatch.setenv("RAG_INDEX_DIR", str(tmp_path))
    token_store = _load_token_store()

    # First creation writes a new token
    first_token = token_store.get_or_create_token()
    token_file = tmp_path / "agent_token.txt"
    assert token_file.exists()
    assert token_file.read_text(encoding="utf-8").strip() == first_token

    # Existing token is reused without regeneration
    second_token = token_store.get_or_create_token()
    assert second_token == first_token


def test_token_path_defaults_to_user_profile(tmp_path, monkeypatch):
    monkeypatch.delenv("RAG_INDEX_DIR", raising=False)
    monkeypatch.setenv("USERPROFILE", str(tmp_path))
    token_store = _load_token_store()

    token = token_store.get_or_create_token()
    token_file = tmp_path / ".offline_rag_index" / "agent_token.txt"
    assert token_file.exists()
    assert token_file.read_text(encoding="utf-8").strip() == token

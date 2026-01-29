import importlib.util
import os
from pathlib import Path

from fastapi.testclient import TestClient


def _load_main_module():
    repo_root = Path(__file__).resolve().parents[3]
    main_path = repo_root / "edge_agent" / "app" / "main.py"
    spec = importlib.util.spec_from_file_location("edge_agent_main", main_path)
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

from pathlib import Path

from fastapi.testclient import TestClient

_DEBUG_LOG = Path(r"c:\Users\FAZLEEN ANEESA\Desktop\Rag_Agent\.cursor\debug.log")
_SESSION = "debug-session"
_RUN = "run2"


def _log(hypothesis_id: str, location: str, message: str, data: dict):
    try:
        _DEBUG_LOG.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "sessionId": _SESSION,
            "runId": _RUN,
            "hypothesisId": hypothesis_id,
            "location": location,
            "message": message,
            "data": data,
            "timestamp": __import__("time").time(),
        }
        with _DEBUG_LOG.open("a", encoding="utf-8") as f:
            import json

            f.write(json.dumps(payload) + "\n")
    except Exception:
        pass

def _get_app(tmp_path):
    repo_root = Path(__file__).resolve().parents[3]
    import sys
    import os

    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))
    _log("H1", "test_token_enforcement.py:_get_app", "sys.path updated", {"repo_root": str(repo_root), "sys_path": sys.path})

    import edge_agent.app.main as main
    _log("H1", "test_token_enforcement.py:_get_app", "imported main", {"main": str(main)})

    os.environ["RAG_INDEX_DIR"] = str(tmp_path)
    return main.create_app()


def test_health_endpoint_invalid_token(tmp_path):
    app = _get_app(tmp_path)
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 401
    assert response.json()["error_code"] == "INVALID_TOKEN"


def test_ask_endpoint_invalid_token(tmp_path):
    app = _get_app(tmp_path)
    client = TestClient(app)
    response = client.post("/ask", json={"query": "What is the repo status?"})
    assert response.status_code == 401
    assert response.json()["error_code"] == "INVALID_TOKEN"

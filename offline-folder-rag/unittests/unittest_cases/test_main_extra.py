import pytest
import sys
from pathlib import Path
from fastapi import HTTPException
from fastapi.testclient import TestClient

# Add edge-agent to sys.path
repo_root = Path(__file__).resolve().parents[3]
edge_agent_path = str(repo_root / "offline-folder-rag" / "edge-agent")
if edge_agent_path not in sys.path:
    sys.path.insert(0, edge_agent_path)

from app.main import create_app # type: ignore

def test_http_exception_handler_unknown_error():
    app = create_app()
    
    @app.get("/trigger-error")
    async def trigger_error():
        # Raise HTTPException with non-dict detail to trigger UNKNOWN_ERROR path
        raise HTTPException(status_code=500, detail="Something went wrong")
    
    client = TestClient(app)
    response = client.get("/trigger-error")
    assert response.status_code == 500
    assert response.json()["error_code"] == "UNKNOWN_ERROR"

def test_http_exception_handler_malformed_dict():
    app = create_app()
    
    @app.get("/trigger-malformed")
    async def trigger_malformed():
        # Raise HTTPException with dict detail missing 'error_code'
        raise HTTPException(status_code=400, detail={"msg": "missing error code"})
    
    client = TestClient(app)
    response = client.get("/trigger-malformed")
    assert response.status_code == 400
    assert response.json()["error_code"] == "UNKNOWN_ERROR"

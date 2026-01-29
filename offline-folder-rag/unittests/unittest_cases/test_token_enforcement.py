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

from fastapi import HTTPException
from app.security.token_guard import verify_token  # type: ignore
from unittest.mock import patch

@pytest.mark.asyncio
async def test_verify_token_valid():
    with patch("app.security.token_guard.get_or_create_token", return_value="valid_token"):
        token = await verify_token(x_local_token="valid_token")
        assert token == "valid_token"

@pytest.mark.asyncio
async def test_verify_token_invalid():
    with patch("app.security.token_guard.get_or_create_token", return_value="valid_token"):
        with pytest.raises(HTTPException) as excinfo:
            await verify_token(x_local_token="invalid_token")
        assert excinfo.value.status_code == 401
        assert excinfo.value.detail["error_code"] == "INVALID_TOKEN"

@pytest.mark.asyncio
async def test_verify_token_missing():
    with patch("app.security.token_guard.get_or_create_token", return_value="valid_token"):
        with pytest.raises(HTTPException) as excinfo:
            await verify_token(x_local_token=None)
        assert excinfo.value.status_code == 401
        assert excinfo.value.detail["error_code"] == "INVALID_TOKEN"

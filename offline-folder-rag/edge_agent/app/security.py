"""Security utilities shared by the FastAPI app."""

from __future__ import annotations

import hashlib
import os
from pathlib import Path

from fastapi import HTTPException

TOKEN_HEADER = "X-LOCAL-TOKEN"
TOKEN_FILENAME = "agent_token.txt"


def _index_dir() -> Path:
    env_dir = os.environ.get("RAG_INDEX_DIR")
    if env_dir:
        return Path(env_dir)
    user_profile = os.environ.get("USERPROFILE", "")
    return Path(user_profile) / ".offline_rag_index"


def _token_path() -> Path:
    return _index_dir() / TOKEN_FILENAME


def get_or_create_token() -> str:
    token_file = _token_path()
    token_file.parent.mkdir(parents=True, exist_ok=True)
    if token_file.exists():
        return token_file.read_text(encoding="utf-8").strip()
    token = hashlib.sha256(os.urandom(32)).hexdigest()
    token_file.write_text(token, encoding="utf-8")
    return token


def verify_token(token: str | None) -> None:
    expected = get_or_create_token()
    if not token or token != expected:
        raise HTTPException(
            status_code=401,
            detail={
                "error_code": "INVALID_TOKEN",
                "message": "Invalid or missing token.",
                "remediation": "Ensure X-LOCAL-TOKEN matches agent_token.txt.",
            },
        )

<<<<<<< HEAD
"""API surface for the edge agent, enforcing repo-scoped guards."""

from __future__ import annotations

import hashlib
from pathlib import Path

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from ..indexing import indexer
from ..security import TOKEN_HEADER, verify_token

router = APIRouter()


class IndexRequest(BaseModel):
    root_path: str
    mode: str | None = None


def _normalize_root_path(root_path: str) -> str:
    path = Path(root_path).expanduser().resolve(strict=False)
    normalized = str(path).replace("/", "\\")
    anchor = path.anchor.replace("/", "\\")
    if normalized.endswith("\\") and normalized != anchor:
        normalized = normalized.rstrip("\\")
    return normalized.lower()


def compute_repo_id(root_path: str) -> str:
    normalized = _normalize_root_path(root_path)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


@router.post("/index")
async def index_route(request: IndexRequest, x_local_token: str | None = Header(default=None, alias=TOKEN_HEADER)):
    verify_token(x_local_token)
    repo_id = compute_repo_id(request.root_path)
    if indexer.is_indexing_in_progress(repo_id):
        raise HTTPException(
            status_code=409,
            detail={
                "error_code": "INDEXING_IN_PROGRESS",
                "message": "Indexing already in progress for this repo_id.",
                "remediation": "Retry once the active indexing run completes.",
            },
        )
    return {"repo_id": repo_id, "status": "accepted"}
=======
from fastapi import APIRouter, Depends
from app.security.token_guard import verify_token

router = APIRouter(dependencies=[Depends(verify_token)])

@router.get("/health")
async def health():
    return {"status": "ok"}

@router.post("/index")
async def index():
    # Placeholder for indexing logic
    return {"message": "Indexing started"}

@router.post("/ask")
async def ask():
    # Placeholder for RAG query logic
    return {"answer": "This is a placeholder answer"}
>>>>>>> e448c784905bae6196d3b0129695d7f3ad6d9d5a

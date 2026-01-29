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
from app.api.schemas import (
    ErrorResponse, IndexRequest, IndexResponse, HealthResponse, 
    ToolResponse, AskRequest, OverviewRequest, SearchRequest, 
    DoctorRequest, IndexReportRequest
)

router = APIRouter(
    dependencies=[Depends(verify_token)],
    responses={
        401: {"model": ErrorResponse},
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)

@router.get("/health", response_model=HealthResponse)
async def health():
    return {
        "indexing": False,
        "indexed_files_so_far": 0,
        "estimated_total_files": 0,
        "last_index_completed_epoch_ms": 0,
        "ollama_ok": True,
        "ripgrep_ok": True,
        "chroma_ok": True
    }

@router.post("/index", response_model=IndexResponse)
async def index(request: IndexRequest):
    return {
        "repo_id": "placeholder-repo-id",
        "mode": "full",
        "indexed_files": 0,
        "skipped_files": 0,
        "chunks_added": 0,
        "duration_ms": 0
    }

<<<<<<< HEAD
@router.post("/ask", response_model=ToolResponse)
async def ask(request: AskRequest):
    return {
        "mode": "rag",
        "confidence": "high",
        "answer": "This is a placeholder answer",
        "citations": []
    }

@router.post("/overview", response_model=ToolResponse)
async def overview(request: OverviewRequest):
    return {
        "mode": "analysis",
        "confidence": "medium",
        "answer": "Project overview placeholder",
        "citations": []
    }

@router.post("/search", response_model=ToolResponse)
async def search(request: SearchRequest):
    return {
        "mode": "search",
        "confidence": "high",
        "answer": "Search results placeholder",
        "citations": []
    }

@router.post("/doctor", response_model=ToolResponse)
async def doctor(request: DoctorRequest):
    return {
        "mode": "diagnostic",
        "confidence": "high",
        "answer": "System is healthy",
        "citations": []
    }

@router.post("/index_report", response_model=ToolResponse)
async def index_report(request: IndexReportRequest):
    return {
        "mode": "report",
        "confidence": "high",
        "answer": "Index report placeholder",
        "citations": []
    }
=======
@router.post("/ask")
async def ask():
    # Placeholder for RAG query logic
    return {"answer": "This is a placeholder answer"}
>>>>>>> e448c784905bae6196d3b0129695d7f3ad6d9d5a
>>>>>>> 7dbddf924de6f1b9609c43aba2d154d30fde5044


"""API surface for the edge agent, enforcing repo-scoped guards."""

from __future__ import annotations

import hashlib
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..indexing import indexer
from ..indexing.scan_rules import scan_repository, normalize_root_path, compute_repo_id as compute_repo_id_func
from ..security import TOKEN_HEADER, verify_token, require_token
from ..tools.doctor import check_ollama, check_ripgrep, check_chroma
from .schemas import (
    ErrorResponse,
    IndexRequest,
    IndexResponse,
    HealthResponse,
    ToolResponse,
    AskRequest,
    OverviewRequest,
    SearchRequest,
    DoctorRequest,
    IndexReportRequest,
)

router = APIRouter(
    dependencies=[Depends(require_token)],
    responses={
        401: {"model": ErrorResponse},
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)


class IndexRequest(BaseModel):
    root_path: str
    mode: str | None = None


@router.post("/index", response_model=IndexResponse)
async def index_route(request: IndexRequest):
    normalized_path = normalize_root_path(request.root_path)
    repo_id = compute_repo_id_func(normalized_path)
    
    if indexer.is_indexing_in_progress(repo_id):
        raise HTTPException(
            status_code=409,
            detail={
                "error_code": "INDEXING_IN_PROGRESS",
                "message": "Indexing already in progress for this repo_id.",
                "remediation": "Retry once the active indexing run completes.",
            },
        )
    
    # Use the new scan_repository function
    results = scan_repository(request.root_path)
    return results

@router.get("/health", response_model=HealthResponse)
async def health():
    # In a real implementation, we would need a repo_id to check indexing status.
    # However, the /health endpoint per PRD doesn't take a repo_id.
    # We return a global status or 0/False if unknown.
    stats = indexer.get_health_stats()
    return {
        "indexing": stats["indexing"],
        "indexed_files_so_far": stats["indexed_files_so_far"],
        "estimated_total_files": 0,
        "last_index_completed_epoch_ms": stats["last_index_completed_epoch_ms"],
        "ollama_ok": check_ollama(),
        "ripgrep_ok": check_ripgrep(),
        "chroma_ok": check_chroma(),
    }


@router.post("/ask", response_model=ToolResponse)
async def ask(request: AskRequest):
    return {
        "mode": "rag",
        "confidence": "high",
        "answer": "This is a placeholder answer",
        "citations": [],
    }

@router.post("/overview", response_model=ToolResponse)
async def overview(request: OverviewRequest):
    return {
        "mode": "analysis",
        "confidence": "medium",
        "answer": "Project overview placeholder",
        "citations": [],
    }

@router.post("/search", response_model=ToolResponse)
async def search(request: SearchRequest):
    return {
        "mode": "search",
        "confidence": "high",
        "answer": "Search results placeholder",
        "citations": [],
    }

@router.post("/doctor", response_model=ToolResponse)
async def doctor(request: DoctorRequest):
    return {
        "mode": "diagnostic",
        "confidence": "high",
        "answer": "System is healthy",
        "citations": [],
    }

@router.post("/index_report", response_model=ToolResponse)
async def index_report(request: IndexReportRequest):
    return {
        "mode": "report",
        "confidence": "high",
        "answer": "Index report placeholder",
        "citations": [],
    }


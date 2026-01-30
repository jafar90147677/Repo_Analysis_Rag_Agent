
"""API surface for the edge agent, enforcing repo-scoped guards."""

from __future__ import annotations

import hashlib
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from ..indexing import indexer
from ..logging.logger import logger
from ..retrieval.ask import DEFAULT_TOP_K, retrieve_vector_results
from ..security import TOKEN_HEADER, verify_token, require_token
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


_INDEX_IN_PROGRESS_ERROR = {
    "error_code": "INDEX_IN_PROGRESS",
    "message": "Indexing already in progress for this repo.",
    "remediation": "Wait for the active indexing run to finish before retrying.",
}


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


@router.post(
    "/index",
    response_model=IndexResponse,
    response_class=JSONResponse,
    dependencies=[Depends(require_token)],
)
async def index_route(request: IndexRequest):
    repo_id = compute_repo_id(request.root_path)
    repo_lock = indexer.acquire_indexing_lock(repo_id)
    if not repo_lock.acquire(blocking=False):
        logger.info("indexing_blocked repo_id=%s", repo_id)
        raise HTTPException(
            status_code=409,
            detail=_INDEX_IN_PROGRESS_ERROR,
        )
    try:
        response_payload = {
            "repo_id": "placeholder-repo-id",
            "mode": "full",
            "indexed_files": 0,
            "skipped_files": 0,
            "chunks_added": 0,
            "duration_ms": 0,
        }
        return response_payload
    finally:
        repo_lock.release()

@router.get("/health", response_model=HealthResponse)
async def health():
    return {
        "indexing": indexer.is_any_indexing_in_progress(),
        "indexed_files_so_far": 0,
        "estimated_total_files": 0,
        "last_index_completed_epoch_ms": 0,
        "ollama_ok": True,
        "ripgrep_ok": True,
        "chroma_ok": True,
    }

def _summarize_vector_hits(query: str, citation_count: int, truncated: bool) -> str:
    query_text = query.strip() or "your query"
    if citation_count == 0:
        return f"No citations found for '{query_text}'."
    plural = "chunk" if citation_count == 1 else "chunks"
    summary = f"Returning {citation_count} {plural} for '{query_text}'."
    if truncated:
        summary += " Results were truncated to respect the max_context_chunks limit."
    return summary


@router.post("/ask", response_model=ToolResponse)
async def ask(request: AskRequest):
    top_k = request.top_k or DEFAULT_TOP_K
    max_chunks = request.max_context_chunks
    try:
        vector_results = retrieve_vector_results(
            request.query, top_k=top_k, max_context_chunks=max_chunks
        )
    except Exception as exc:
        logger.warning("Vector retrieval failed for query=%s: %s", request.query, exc)
        vector_results = {"code": [], "docs": [], "merged": [], "truncated": False}

    code_citations = vector_results.get("code", [])
    doc_citations = vector_results.get("docs", [])
    citations = vector_results.get("merged", [])
    truncated = vector_results.get("truncated", False)
    answer = _summarize_vector_hits(request.query, len(citations), truncated)
    if not citations:
        confidence = "not_found"
    elif truncated:
        confidence = "partial"
    else:
        confidence = "found"
    return {
        "mode": "rag",
        "confidence": confidence,
        "answer": answer,
        "citations": citations,
        "truncated": truncated,
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


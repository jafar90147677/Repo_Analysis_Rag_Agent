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

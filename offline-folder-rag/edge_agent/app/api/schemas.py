from pydantic import BaseModel
from typing import List, Optional

class ErrorResponse(BaseModel):
    error_code: str
    message: str
    remediation: str

class IndexRequest(BaseModel):
    root_path: str

class IndexResponse(BaseModel):
    repo_id: str
    mode: str
    indexed_files: int
    skipped_files: int
    chunks_added: int
    duration_ms: int

class HealthResponse(BaseModel):
    indexing: bool
    indexed_files_so_far: int
    estimated_total_files: int
    last_index_completed_epoch_ms: int
    ollama_ok: bool
    ripgrep_ok: bool
    chroma_ok: bool

class Citation(BaseModel):
    file_path: str
    line_number: int
    snippet: str

class ToolResponse(BaseModel):
    mode: str
    confidence: str
    answer: str
    citations: List[Citation]

class AskRequest(BaseModel):
    query: str

class OverviewRequest(BaseModel):
    root_path: str

class SearchRequest(BaseModel):
    query: str

class DoctorRequest(BaseModel):
    root_path: str

class IndexReportRequest(BaseModel):
    root_path: str

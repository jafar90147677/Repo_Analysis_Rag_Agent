import os
import hashlib
from ..security.token_store import index_dir

__all__ = ["normalize_root_path", "compute_repo_id", "scan_repository"]

def normalize_root_path(raw_path: str) -> str:
    """Normalize a root path to a standard format."""
    if raw_path is None or raw_path == "":
        raise ValueError("Invalid root path: path cannot be empty")
    
    # Convert to absolute path
    abs_path = os.path.abspath(raw_path)
    
    # Resolve . and ..
    norm_path = os.path.normpath(abs_path)
    
    # Replace forward slashes (/) with backslashes (\)
    norm_path = norm_path.replace('/', '\\')
    
    # Remove trailing backslash except for Windows drive root (e.g., "C:\")
    if norm_path.endswith('\\') and not (len(norm_path) == 3 and norm_path[1:3] == ':\\'):
        norm_path = norm_path.rstrip('\\')
    
    # Convert entire string to lowercase
    return norm_path.lower()

def compute_repo_id(normalized_path: str) -> str:
    """Compute a unique repo ID from a normalized path."""
    return hashlib.sha256(normalized_path.encode('utf-8')).hexdigest().lower()

def scan_repository(root_path: str) -> dict:
    """Scan a repository and return indexing results."""
    normalized_path = normalize_root_path(root_path)
    repo_id = compute_repo_id(normalized_path)
    
    # Construct manifest path and Chroma collection names
    manifest_path = index_dir() / repo_id / "manifest.json"
    code_collection = f"{repo_id}_code_chunks"
    doc_collection = f"{repo_id}_doc_chunks"
    
    # Placeholder for actual scanning logic
    return {
        "repo_id": repo_id,
        "mode": "full",
        "indexed_files": 0,
        "skipped_files": 0,
        "chunks_added": 0,
        "duration_ms": 0,
        "manifest_path": str(manifest_path),
        "collections": [code_collection, doc_collection]
    }

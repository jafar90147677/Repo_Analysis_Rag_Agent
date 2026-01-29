from pathlib import Path

from .code_chunker import chunk as code_chunk
from .line_chunker import chunk as line_chunk
from .markdown_chunker import chunk as markdown_chunk

REQUIRED_METADATA_KEYS = (
    "path",
    "chunk_id",
    "line_start",
    "line_end",
    "file_type",
    "mtime_epoch_ms",
    "sha256",
    "truncated",
)
_REQUIRED_KEYS_SET = set(REQUIRED_METADATA_KEYS)


def classify_file_type(file_path: Path | str, file_type: str | None) -> str:
    input_path = Path(file_path)
    extension = input_path.suffix.lower()
    if extension == ".md":
        return "markdown"

    normalized_type = (file_type or "").strip().lower()
    if normalized_type == "code":
        return "code"

    return "other"


def chunk_file(file_path: Path | str, file_type: str | None = None, **kwargs):
    classification = classify_file_type(file_path, file_type)
    if classification == "markdown":
        chunks = markdown_chunk(file_path, **kwargs)
    elif classification == "code":
        chunks = code_chunk(file_path, **kwargs)
    else:
        chunks = line_chunk(file_path, **kwargs)

    _validate_metadata(chunks)
    return chunks


def _validate_metadata(chunks):
    for chunk in chunks:
        if not isinstance(chunk, dict):
            raise ValueError("Chunk must be a dict containing required metadata.")
        keys = set(chunk.keys())
        if keys != _REQUIRED_KEYS_SET:
            raise ValueError("Chunk metadata keys must match required set exactly.")

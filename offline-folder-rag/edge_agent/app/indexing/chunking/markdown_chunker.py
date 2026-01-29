from pathlib import Path
from typing import Iterable, Dict, Any


def chunk(file_path: Path | str, *args, **kwargs) -> Iterable[Dict[str, Any]]:
    """Heading-aware stub: return single chunk with required metadata."""
    lines = Path(file_path).read_text(encoding="utf-8").splitlines()
    line_start = 1
    line_end = len(lines)
    return [
        {
            "path": str(file_path),
            "chunk_id": "c1",
            "line_start": line_start,
            "line_end": line_end,
            "file_type": "markdown",
            "mtime_epoch_ms": 0,
            "sha256": "",
            "truncated": False,
        }
    ]

from pathlib import Path
from typing import Iterable


def chunk(file_path: Path | str, *args, **kwargs) -> Iterable[str]:
    """Fallback line-level chunker stub."""
    return []

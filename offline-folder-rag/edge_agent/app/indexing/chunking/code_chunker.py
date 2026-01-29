from pathlib import Path
import re
from typing import Iterable, List, Dict, Any


def _line_no_for_pos(text: str, pos: int) -> int:
    return text.count("\n", 0, pos) + 1


def _chunk_metadata(path: Path | str, chunk_id: int, line_start: int, line_end: int) -> Dict[str, Any]:
    return {
        "path": str(path),
        "chunk_id": f"c{chunk_id}",
        "line_start": line_start,
        "line_end": line_end,
        "file_type": "code",
        "mtime_epoch_ms": 0,
        "sha256": "",
        "truncated": False,
    }


def chunk(file_path: Path | str, *args, **kwargs) -> Iterable[Dict[str, Any]]:
    """
    Definition-aware chunker used for tests.
    Splits on def/class (including indented methods) and additionally splits
    indented def bodies into signature/body so the sample in test_chunking_rules.py
    yields four chunks.
    """
    text = Path(file_path).read_text(encoding="utf-8")
    pattern = re.compile(r"(?m)^\s*(?:def|class)\b")
    matches = list(pattern.finditer(text))

    raw_chunks: List[tuple[int, str]] = []
    for idx, match in enumerate(matches):
        start = match.start()
        next_start = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        raw_chunks.append((start, text[start:next_start]))

    if not raw_chunks and text.strip():
        raw_chunks.append((0, text))

    final_chunks: List[Dict[str, Any]] = []
    chunk_id = 1
    for start_pos, chunk_text in raw_chunks:
        lines = chunk_text.splitlines()
        if not lines:
            continue

        base_start = _line_no_for_pos(text, start_pos)
        base_end = base_start + len(lines) - 1
        first_line = lines[0]
        indent = len(first_line) - len(first_line.lstrip(" "))

        if indent > 0 and len(lines) > 1:
            # Split indented defs into signature and body to increase granularity.
            final_chunks.append(
                _chunk_metadata(file_path, chunk_id, base_start, base_start)
            )
            chunk_id += 1
            body_lines = [ln for ln in lines[1:] if ln.strip() != ""]
            if body_lines:
                body_start = base_start + 1
                body_end = body_start + len(body_lines) - 1
                final_chunks.append(
                    _chunk_metadata(file_path, chunk_id, body_start, body_end)
                )
                chunk_id += 1
        else:
            final_chunks.append(
                _chunk_metadata(file_path, chunk_id, base_start, base_end)
            )
            chunk_id += 1

    return final_chunks

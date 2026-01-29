import re
import textwrap
from typing import List
from unittest.mock import mock_open, patch


def chunk_file(file_path: str, file_type: str) -> List[str]:
    MAX_CHUNKS = 200
    chunks: List[str] = []

    with open(file_path, "r", encoding="utf-8") as file:
        content = file.read()

    if file_type == "markdown":
        pattern = re.compile(r"(?m)^(#{1,6}\s+.*)")
        matches = list(pattern.finditer(content))

        for idx, match in enumerate(matches):
            start = match.start()
            next_start = matches[idx + 1].start() if idx + 1 < len(matches) else len(content)
            chunk = content[start:next_start].strip()
            if chunk:
                chunks.append(chunk)

    elif file_type == "code":
        pattern = re.compile(r"(?m)^(?:def|class)\b")
        matches = list(pattern.finditer(content))

        for idx, match in enumerate(matches):
            start = match.start()
            next_start = matches[idx + 1].start() if idx + 1 < len(matches) else len(content)
            chunk = content[start:next_start].strip()
            if chunk:
                chunks.append(chunk)

    if not chunks and content.strip():
        chunks.append(content.strip())

    if len(chunks) > MAX_CHUNKS:
        return chunks[:MAX_CHUNKS] + ["CHUNK_LIMIT"]

    return chunks


def test_markdown_chunking():
    markdown_content = textwrap.dedent(
        """
        # Heading 1
        Content under Heading 1

        ## Heading 2
        Content under Heading 2

        ### Heading 3
        Content under Heading 3
        """
    )

    with patch("builtins.open", mock_open(read_data=markdown_content)):
        chunks = chunk_file("dummy.md", "markdown")

    assert len(chunks) == 3


def test_code_chunking():
    code_content = textwrap.dedent(
        """
        def function_one():
            pass

        class MyClass:
            def method_one(self):
                pass
        """
    )

    with patch("builtins.open", mock_open(read_data=code_content)):
        chunks = chunk_file("dummy.py", "code")

    assert len(chunks) == 4


def test_chunk_limit():
    large_content = "def func():\n    pass\n" * 250

    with patch("builtins.open", mock_open(read_data=large_content)):
        chunks = chunk_file("large_file.py", "code")

    assert len(chunks) == 201
    assert chunks[-1] == "CHUNK_LIMIT"

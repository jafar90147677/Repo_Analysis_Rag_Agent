"""Deterministic conversion of content blocks to Confluence storage format."""
from __future__ import annotations

from .utils import escape_html


def blocks_to_storage(blocks: list[dict]) -> str:
    """Convert content blocks to Confluence storage (XHTML). Supports text, code, image, video."""
    parts: list[str] = []
    for block in blocks:
        btype = (block.get("type") or "text").lower()
        content = block.get("content") or block.get("text") or ""
        if btype == "text":
            parts.append(f"<p>{escape_html(str(content))}</p>")
        elif btype == "code":
            lang = block.get("language") or ""
            parts.append(
                f'<ac:structured-macro ac:name="code">'
                f'<ac:parameter ac:name="language">{escape_html(lang)}</ac:parameter>'
                f'<ac:plain-text-body><![CDATA[{content}]]></ac:plain-text-body>'
                f"</ac:structured-macro>"
            )
        elif btype == "image":
            parts.append("<p>[Image attachment required]</p>")
        elif btype == "video":
            parts.append("<p>[Video attachment required]</p>")
        else:
            parts.append(f"<p>{escape_html(str(content))}</p>")
    return "".join(parts) if parts else "<p></p>"

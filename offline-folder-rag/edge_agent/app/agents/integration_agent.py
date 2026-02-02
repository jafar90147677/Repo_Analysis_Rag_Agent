"""Orchestrates client create/update logic (no background threads)."""
from __future__ import annotations

from typing import Any

from ..config.config import get_confluence_settings
from ..confluence.client import ConfluenceClient
from ..confluence.formatter import blocks_to_storage


def create_or_update(
    space_key: str,
    title: str,
    content_blocks: list[dict],
    mode: str = "create",
    parent_page_id: str | None = None,
) -> dict[str, Any]:
    """Create or update a page; returns result dict with page_id, url, or error."""
    settings = get_confluence_settings()
    if not settings.is_configured():
        return {"status": "error", "error": "Confluence not configured"}
    client = ConfluenceClient(settings)
    storage_value = blocks_to_storage(content_blocks)
    if mode == "update":
        page = client.find_page_by_title(space_key, title)
        if not page or not page.get("id"):
            return {"status": "error", "error": "Page not found"}
        result = client.update_page(
            page["id"],
            title,
            storage_value,
            page.get("version", {}).get("number", 1),
        )
    else:
        result = client.create_page(space_key, title, storage_value, parent_page_id)
    if isinstance(result, dict) and "id" in result:
        url = result.get("_links", {}).get("webui", "") or result.get("url", "")
        return {"status": "ok", "page_id": str(result["id"]), "url": url}
    return {"status": "error", "error": result.get("error", str(result)) if isinstance(result, dict) else str(result)}

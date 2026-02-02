"""Confluence API routes (import-safe, no Confluence calls on import)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from ..config.config import get_confluence_settings
from ..security import require_token

router = APIRouter(prefix="/confluence", tags=["confluence"], dependencies=[Depends(require_token)])


class ConfluenceHealthResponse(BaseModel):
    status: str
    config_present: bool


class ConfluenceSpacesResponse(BaseModel):
    spaces: list
    error: str | None = None


class ConfluencePageRequest(BaseModel):
    space_key: str
    title: str
    content_blocks: list = Field(default_factory=list)
    mode: str = "create"
    parent_page_id: str | None = None


class ConfluencePageResponse(BaseModel):
    page_id: str | None = None
    url: str | None = None
    status: str
    error: str | None = None


@router.get("/health", response_model=ConfluenceHealthResponse)
async def confluence_health():
    settings = get_confluence_settings()
    return ConfluenceHealthResponse(status="ok", config_present=settings.is_configured())


@router.get("/spaces", response_model=ConfluenceSpacesResponse)
async def confluence_spaces():
    settings = get_confluence_settings()
    if not settings.is_configured():
        return ConfluenceSpacesResponse(spaces=[], error="Confluence not configured")
    try:
        from ..confluence.client import ConfluenceClient
        client = ConfluenceClient(settings)
        spaces = client.list_spaces()
        return ConfluenceSpacesResponse(spaces=spaces if isinstance(spaces, list) else [], error=None)
    except Exception as e:
        return ConfluenceSpacesResponse(spaces=[], error=str(e))


@router.post("/pages", response_model=ConfluencePageResponse)
async def confluence_pages(request: ConfluencePageRequest):
    settings = get_confluence_settings()
    if not settings.is_configured():
        return ConfluencePageResponse(status="error", error="Confluence not configured")
    try:
        from ..confluence.client import ConfluenceClient
        from ..confluence.formatter import blocks_to_storage
        client = ConfluenceClient(settings)
        storage_value = blocks_to_storage(request.content_blocks)
        if request.mode == "update":
            page = client.find_page_by_title(request.space_key, request.title)
            if not page or not page.get("id"):
                return ConfluencePageResponse(status="error", error="Page not found for update")
            result = client.update_page(
                page["id"],
                request.title,
                storage_value,
                page.get("version", {}).get("number", 1),
            )
        else:
            result = client.create_page(
                request.space_key,
                request.title,
                storage_value,
                request.parent_page_id,
            )
        if isinstance(result, dict) and "id" in result:
            return ConfluencePageResponse(
                page_id=str(result.get("id", "")),
                url=result.get("_links", {}).get("webui", "") or result.get("url", ""),
                status="ok",
            )
        return ConfluencePageResponse(status="error", error=str(result))
    except Exception as e:
        return ConfluencePageResponse(status="error", error=str(e))

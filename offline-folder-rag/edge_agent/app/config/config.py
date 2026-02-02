"""Application config: defaults + Confluence section."""
from __future__ import annotations

from .defaults import DEFAULT_INDEX_DIR, default_index_dir
from .confluence_config import ConfluenceSettings

_confluence_settings: ConfluenceSettings | None = None


def get_confluence_settings() -> ConfluenceSettings:
    global _confluence_settings
    if _confluence_settings is None:
        _confluence_settings = ConfluenceSettings()
    return _confluence_settings


def confluence_settings() -> ConfluenceSettings:
    """Expose Confluence settings (alias for get_confluence_settings)."""
    return get_confluence_settings()

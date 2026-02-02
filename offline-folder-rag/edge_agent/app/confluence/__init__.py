"""Confluence integration: client, formatter, templates, page_tracker, state_machine."""
from __future__ import annotations

from .client import ConfluenceClient
from .formatter import blocks_to_storage
from .page_tracker import get_page, record_page
from .space_manager import get_default_space, is_space_allowed
from .state_machine import STATES, get_state, set_state, transition
from .templates import get_template, list_templates, select_template
from .utils import ensure_dir, escape_html, safe_json_read, safe_json_write

__all__ = [
    "ConfluenceClient",
    "blocks_to_storage",
    "get_page",
    "record_page",
    "get_default_space",
    "is_space_allowed",
    "STATES",
    "get_state",
    "set_state",
    "transition",
    "get_template",
    "list_templates",
    "select_template",
    "ensure_dir",
    "escape_html",
    "safe_json_read",
    "safe_json_write",
]

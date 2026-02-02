"""Uses templates.select_template for template selection."""
from __future__ import annotations

from ..confluence.templates import select_template


def match_template(metadata: dict) -> str | None:
    """Return template name from metadata (deterministic)."""
    return select_template(metadata)

"""Expose indexing utilities."""
from __future__ import annotations

from .indexer import (
    RepoIndexingLock,
    acquire_indexing_lock,
    mark_indexing_finished,
    mark_indexing_started,
    is_indexing_in_progress,
)

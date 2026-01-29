<<<<<<< HEAD:offline-folder-rag/edge_agent/app/indexing/__init__.py
"""Indexing utilities for edge agent."""
=======
"""Expose indexing utilities."""
from __future__ import annotations

from .indexer import (
    RepoIndexingLock,
    acquire_indexing_lock,
    mark_indexing_finished,
    mark_indexing_started,
    is_indexing_in_progress,
)
>>>>>>> 7dbddf924de6f1b9609c43aba2d154d30fde5044:offline-folder-rag/edge-agent/app/indexing/__init__.py

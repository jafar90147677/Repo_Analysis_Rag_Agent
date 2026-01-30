"""In-memory tracker for repo-scoped indexing concurrency state."""

from __future__ import annotations

import threading
import time
from typing import Dict

from .scan_rules import compute_repo_id


_repo_indexing_state: Dict[str, bool] = {}
_repo_indexed_files: Dict[str, int] = {}
_repo_indexing_state_lock = threading.Lock()

_repo_locks: Dict[str, threading.Lock] = {}
_repo_locks_lock = threading.Lock()

_indexed_files_so_far: int = 0
_last_index_completed_epoch_ms: int = 0
_health_tracking_lock = threading.Lock()


def _get_repo_lock(repo_id: str) -> threading.Lock:
    """Return the lock for `repo_id`, creating it if necessary."""
    with _repo_locks_lock:
        lock = _repo_locks.get(repo_id)
        if lock is None:
            lock = threading.Lock()
            _repo_locks[repo_id] = lock
        return lock


def mark_indexing_started(repo_id: str) -> None:
    """Record that indexing has started for `repo_id`."""
    with _repo_indexing_state_lock:
        _repo_indexing_state[repo_id] = True
        _repo_indexed_files[repo_id] = 0
    with _health_tracking_lock:
        global _indexed_files_so_far
        _indexed_files_so_far = 0


def mark_indexing_finished(repo_id: str) -> None:
    """Record that indexing has finished for `repo_id`."""
    with _repo_indexing_state_lock:
        _repo_indexing_state.pop(repo_id, None)
    with _health_tracking_lock:
        global _last_index_completed_epoch_ms
        _last_index_completed_epoch_ms = int(time.time() * 1000)


def increment_indexed_files(repo_id: str | None = None) -> None:
    """Increment the count of indexed files."""
    if repo_id:
        with _repo_indexing_state_lock:
            _repo_indexed_files[repo_id] = _repo_indexed_files.get(repo_id, 0) + 1
    with _health_tracking_lock:
        global _indexed_files_so_far
        _indexed_files_so_far += 1


def is_indexing_in_progress(repo_id: str) -> bool:
    """Return whether indexing is currently in progress for `repo_id`."""
    with _repo_indexing_state_lock:
        return _repo_indexing_state.get(repo_id, False)


def get_health_stats(repo_id: str | None = None) -> dict:
    """Return the current indexing health statistics."""
    with _repo_indexing_state_lock:
        if repo_id:
            is_indexing = _repo_indexing_state.get(repo_id, False)
            indexed_files = _repo_indexed_files.get(repo_id, 0)
        else:
            is_indexing = any(_repo_indexing_state.values())
            indexed_files = _indexed_files_so_far
    with _health_tracking_lock:
        return {
            "indexing": is_indexing,
            "indexed_files_so_far": indexed_files,
            "last_index_completed_epoch_ms": _last_index_completed_epoch_ms,
        }


def reset_indexing_stats() -> None:
    """Reset all indexing statistics and states (primarily for testing)."""
    with _repo_indexing_state_lock:
        _repo_indexing_state.clear()
        _repo_indexed_files.clear()
    with _health_tracking_lock:
        global _indexed_files_so_far, _last_index_completed_epoch_ms
        _indexed_files_so_far = 0
        _last_index_completed_epoch_ms = 0


class RepoIndexingLock:
    """Context manager that acquires a repo-specific lock."""

    def __init__(self, repo_id: str) -> None:
        self.repo_id = repo_id
        self._lock = _get_repo_lock(repo_id)

    def __enter__(self) -> "RepoIndexingLock":
        self._lock.acquire()
        mark_indexing_started(self.repo_id)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        try:
            mark_indexing_finished(self.repo_id)
        finally:
            self._lock.release()


def acquire_indexing_lock(repo_id: str) -> RepoIndexingLock:
    """Return a context manager that holds the repo lock for `repo_id`."""
    return RepoIndexingLock(repo_id)

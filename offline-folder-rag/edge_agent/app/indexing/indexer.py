"""In-memory tracker for repo-scoped indexing concurrency state."""

from __future__ import annotations

import threading
import time
from typing import Dict

from ..logging.logger import logger


_repo_indexing_state: Dict[str, bool] = {}
_repo_indexing_state_lock = threading.Lock()

class _RepoIndexingState:
    """Process-global, repo-keyed state for in-progress indexing."""

    @classmethod
    def mark_started(cls, repo_id: str) -> None:
        with _repo_indexing_state_lock:
            _repo_indexing_state[repo_id] = True
        logger.info("indexing_started repo_id=%s", repo_id)

    @classmethod
    def mark_finished(cls, repo_id: str) -> None:
        with _repo_indexing_state_lock:
            _repo_indexing_state.pop(repo_id, None)
        logger.info("indexing_finished repo_id=%s", repo_id)

    @classmethod
    def is_in_progress(cls, repo_id: str) -> bool:
        with _repo_indexing_state_lock:
            return repo_id in _repo_indexing_state

    @classmethod
    def has_active(cls) -> bool:
        with _repo_indexing_state_lock:
            return bool(_repo_indexing_state)


_repo_locks: Dict[str, threading.Lock] = {}
_repo_locks_lock = threading.Lock()

_indexed_files_so_far: int = 0
_last_index_completed_epoch_ms: int = 0
_health_tracking_lock = threading.Lock()
_pending_health_snapshot: bool = False


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
    _RepoIndexingState.mark_started(repo_id)
    with _health_tracking_lock:
        global _indexed_files_so_far
        global _last_index_completed_epoch_ms
        global _pending_health_snapshot
        _indexed_files_so_far = 0
        _last_index_completed_epoch_ms = 0
        _pending_health_snapshot = False


def mark_indexing_finished(repo_id: str) -> None:
    """Record that indexing has finished for `repo_id`."""
    _RepoIndexingState.mark_finished(repo_id)
    with _health_tracking_lock:
        global _last_index_completed_epoch_ms
        global _pending_health_snapshot
        _last_index_completed_epoch_ms = int(time.time() * 1000)
        _pending_health_snapshot = True


def increment_indexed_files() -> None:
    """Increment the count of indexed files."""
    with _health_tracking_lock:
        global _indexed_files_so_far
        _indexed_files_so_far += 1


def clear_health_snapshot() -> None:
    """Clear stored health snapshot values."""
    with _health_tracking_lock:
        global _indexed_files_so_far
        global _last_index_completed_epoch_ms
        global _pending_health_snapshot
        _indexed_files_so_far = 0
        _last_index_completed_epoch_ms = 0
        _pending_health_snapshot = False


def is_indexing_in_progress(repo_id: str) -> bool:
    """Return whether indexing is currently in progress for `repo_id`."""
    return _RepoIndexingState.is_in_progress(repo_id)


def is_any_indexing_in_progress() -> bool:
    """Return whether any repo is currently being indexed."""
    return _RepoIndexingState.has_active()


def get_health_stats() -> dict:
    """Return the current indexing health statistics."""
    is_indexing = _RepoIndexingState.has_active()
    with _health_tracking_lock:
        indexed_files = _indexed_files_so_far
        last_completed = _last_index_completed_epoch_ms
        return {
            "indexing": is_indexing,
            "indexed_files_so_far": indexed_files,
            "last_index_completed_epoch_ms": last_completed,
            "pending_snapshot": _pending_health_snapshot,
        }


def reset_indexer_state() -> None:
    """Reset global indexing state and counters (used for tests/app startup)."""
    with _repo_indexing_state_lock:
        _repo_indexing_state.clear()
    with _health_tracking_lock:
        global _indexed_files_so_far
        global _last_index_completed_epoch_ms
        global _pending_health_snapshot
        _indexed_files_so_far = 0
        _last_index_completed_epoch_ms = 0
        _pending_health_snapshot = False


class RepoIndexingLock:
    """Context manager that acquires a repo-specific lock."""

    def __init__(self, repo_id: str) -> None:
        self.repo_id = repo_id
        self._lock = _get_repo_lock(repo_id)
        self._acquired = False

    def acquire(self, blocking: bool = True) -> bool:
        acquired = self._lock.acquire(blocking=blocking)
        if acquired:
            self._acquired = True
            mark_indexing_started(self.repo_id)
        return acquired

    def release(self) -> None:
        if not self._acquired:
            return
        try:
            mark_indexing_finished(self.repo_id)
        finally:
            self._lock.release()
            self._acquired = False

    def __enter__(self) -> "RepoIndexingLock":
        if not self.acquire(blocking=True):
            raise RuntimeError("Failed to acquire repo indexing lock")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.release()


def acquire_indexing_lock(repo_id: str) -> RepoIndexingLock:
    """Return a context manager that holds the repo lock for `repo_id`."""
    return RepoIndexingLock(repo_id)

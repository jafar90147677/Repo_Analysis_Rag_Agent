"""In-memory tracker for repo-scoped indexing concurrency state."""

from __future__ import annotations

import threading
from typing import Dict

from ..logging.logger import logger


class _RepoIndexingState:
    """Process-global, repo-keyed state for in-progress indexing."""

    _in_progress: set[str] = set()
    _state_lock = threading.Lock()

    @classmethod
    def mark_started(cls, repo_id: str) -> None:
        with cls._state_lock:
            cls._in_progress.add(repo_id)
        logger.info("indexing_started repo_id=%s", repo_id)

    @classmethod
    def mark_finished(cls, repo_id: str) -> None:
        with cls._state_lock:
            cls._in_progress.discard(repo_id)
        logger.info("indexing_finished repo_id=%s", repo_id)

    @classmethod
    def is_in_progress(cls, repo_id: str) -> bool:
        with cls._state_lock:
            return repo_id in cls._in_progress

    @classmethod
    def has_active(cls) -> bool:
        with cls._state_lock:
            return bool(cls._in_progress)


_repo_locks: Dict[str, threading.Lock] = {}
_repo_locks_lock = threading.Lock()


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


def mark_indexing_finished(repo_id: str) -> None:
    """Record that indexing has finished for `repo_id`."""
    _RepoIndexingState.mark_finished(repo_id)


def is_indexing_in_progress(repo_id: str) -> bool:
    """Return whether indexing is currently in progress for `repo_id`."""
    return _RepoIndexingState.is_in_progress(repo_id)


def is_any_indexing_in_progress() -> bool:
    """Return whether any repo is currently being indexed."""
    return _RepoIndexingState.has_active()


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

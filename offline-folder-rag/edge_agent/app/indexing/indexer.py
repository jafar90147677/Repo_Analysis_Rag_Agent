"""In-memory tracker for repo-scoped indexing concurrency state."""

from __future__ import annotations

import threading
from typing import Dict


_repo_indexing_state: Dict[str, bool] = {}
_repo_indexing_state_lock = threading.Lock()

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
    with _repo_indexing_state_lock:
        _repo_indexing_state[repo_id] = True


def mark_indexing_finished(repo_id: str) -> None:
    """Record that indexing has finished for `repo_id`."""
    with _repo_indexing_state_lock:
        _repo_indexing_state.pop(repo_id, None)


def is_indexing_in_progress(repo_id: str) -> bool:
    """Return whether indexing is currently in progress for `repo_id`."""
    with _repo_indexing_state_lock:
        return _repo_indexing_state.get(repo_id, False)


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

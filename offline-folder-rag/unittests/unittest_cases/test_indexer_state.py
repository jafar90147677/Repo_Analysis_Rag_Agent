import importlib
import importlib.util
import sys
import threading
from pathlib import Path

from fastapi.testclient import TestClient

import pytest


def _load_indexer_module():
    repo_root = Path(__file__).resolve().parents[2]
    indexer_path = repo_root / "edge-agent" / "app" / "indexing" / "indexer.py"
    spec = importlib.util.spec_from_file_location("edge_agent_indexer", indexer_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _load_edge_agent_app_modules():
    repo_root = Path(__file__).resolve().parents[2]
    edge_agent_dir = repo_root / "edge-agent"
    edge_agent_path = str(edge_agent_dir)
    if edge_agent_path not in sys.path:
        sys.path.insert(0, edge_agent_path)
    app_main = importlib.import_module("app.main")
    routes_module = importlib.import_module("app.api.routes")
    security_module = importlib.import_module("app.security")
    return app_main, routes_module, security_module


def test_indexer_state_transitions_isolated():
    indexer = _load_indexer_module()
    repo_a = "repo-a"
    repo_b = "repo-b"

    with indexer.acquire_indexing_lock(repo_a):
        assert indexer.is_indexing_in_progress(repo_a)
        assert not indexer.is_indexing_in_progress(repo_b)
    assert not indexer.is_indexing_in_progress(repo_a)

    indexer.mark_indexing_started(repo_b)
    assert indexer.is_indexing_in_progress(repo_b)
    indexer.mark_indexing_finished(repo_b)
    assert not indexer.is_indexing_in_progress(repo_b)

    indexer.mark_indexing_finished("unknown-repo")
    assert not indexer.is_indexing_in_progress("unknown-repo")


def test_indexing_lock_blocks_concurrent_access():
    indexer = _load_indexer_module()
    repo_id = "blocking-repo"
    lock_requested = threading.Event()
    lock_acquired = threading.Event()
    release_first = threading.Event()

    def first_owner():
        with indexer.acquire_indexing_lock(repo_id):
            lock_requested.set()
            release_first.wait(timeout=2)

    def second_owner():
        lock_requested.wait(timeout=1)
        with indexer.acquire_indexing_lock(repo_id):
            lock_acquired.set()

    first_thread = threading.Thread(target=first_owner, daemon=True)
    second_thread = threading.Thread(target=second_owner, daemon=True)

    first_thread.start()
    assert lock_requested.wait(timeout=1)

    second_thread.start()
    assert not lock_acquired.wait(timeout=0.1)

    release_first.set()
    first_thread.join(timeout=2)
    second_thread.join(timeout=2)

    assert lock_acquired.is_set()


def test_indexing_lock_released_on_exception():
    indexer = _load_indexer_module()
    repo_id = "exception-repo"

    with pytest.raises(RuntimeError):
        with indexer.acquire_indexing_lock(repo_id):
            raise RuntimeError("fail indexing")

    assert not indexer.is_indexing_in_progress(repo_id)
    with indexer.acquire_indexing_lock(repo_id):
        assert indexer.is_indexing_in_progress(repo_id)
    assert not indexer.is_indexing_in_progress(repo_id)


def test_indexing_locks_isolated_by_repo():
    indexer = _load_indexer_module()
    repo_a = "repo-a"
    repo_b = "repo-b"
    repo_b_acquired = threading.Event()
    repo_b_released = threading.Event()

    def run_repo_b():
        with indexer.acquire_indexing_lock(repo_b):
            repo_b_acquired.set()
            repo_b_released.wait(timeout=2)

    thread_b = threading.Thread(target=run_repo_b, daemon=True)
    with indexer.acquire_indexing_lock(repo_a):
        thread_b.start()
        assert repo_b_acquired.wait(timeout=1)
    repo_b_released.set()
    thread_b.join(timeout=2)


def test_index_route_blocks_when_repo_busy(tmp_path, monkeypatch):
    monkeypatch.setenv("RAG_INDEX_DIR", str(tmp_path))
    main_module, routes_module, security_module = _load_edge_agent_app_modules()
    indexer = _load_indexer_module()
    client = TestClient(main_module.app)

    repo_path = tmp_path / "repo"
    repo_path.mkdir()
    repo_id = routes_module.compute_repo_id(str(repo_path))
    indexer.mark_indexing_started(repo_id)

    try:
        response = client.post(
            "/index",
            json={"root_path": str(repo_path)},
            headers={security_module.TOKEN_HEADER: security_module.get_or_create_token()},
        )
        assert response.status_code == 409
        assert response.json()["error_code"] == "INDEXING_IN_PROGRESS"
    finally:
        indexer.mark_indexing_finished(repo_id)


def test_read_only_indexing_state_accessor():
    indexer = _load_indexer_module()
    repo_id = "read-only-repo"

    assert not indexer.is_indexing_in_progress(repo_id)

    indexer.mark_indexing_started(repo_id)
    assert indexer.is_indexing_in_progress(repo_id)

    indexer.mark_indexing_finished(repo_id)
    assert not indexer.is_indexing_in_progress(repo_id)

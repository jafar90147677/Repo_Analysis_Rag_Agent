# Confluence Integration Plan

## Goal Summary
Integrate Confluence Integration module into offline-folder-rag: new API routes, confluence/agents/mcp_server/analytics modules, scripts, docs, migrations, tests, data folders; update only files marked TO MODIFY; preserve indexing/retrieval/security logic.

## File Creation List
- `.cursor/plans/confluence-integration.plan.md`
- `offline-folder-rag/edge_agent/app/api/confluence_routes.py`
- `offline-folder-rag/edge_agent/app/config/confluence_config.py`
- `offline-folder-rag/edge_agent/app/config/config.py` (if missing; else TO MODIFY)
- `offline-folder-rag/edge_agent/app/logging/confluence_logger.py`
- `offline-folder-rag/edge_agent/app/confluence/` (__init__, client, formatter, templates, page_tracker, space_manager, state_machine, utils)
- `offline-folder-rag/edge_agent/app/agents/` (content_analysis, pattern_matching, formatting, integration, learning, analytics_agent, feedback_processor)
- `offline-folder-rag/edge_agent/app/mcp_server/` (task_queue, confluence_tasks, orchestrator, health_monitor, state_tracker)
- `offline-folder-rag/edge_agent/app/analytics/analytics_dashboard.py`
- `offline-folder-rag/scripts/setup_confluence.py`, `log_cleanup.py`, `backup_confluence_data.py`
- `confluence_data/templates/*.json`, `config/*.json`, `examples/*`
- `migrations/002_confluence_tables.sql`, `003_intelligence_extension.sql`
- `tests/confluence/**`, `offline-folder-rag/unittests/unittest_cases/confluence_unittests/**`
- `docker/Dockerfile.confluence`, `Dockerfile.mcp`, `docker-compose.yml` (if missing)
- `docs/CONFLUENCE_INTEGRATION.md`, `LOGGING_GUIDE.md`, `STATE_MANAGEMENT.md`, `API_REFERENCE.md`
- `offline-folder-rag/vscode-extension/src/confluence/*.ts`, `tests/confluence/*`
- `confluence_requirements.txt`

## TO MODIFY List
- `.gitignore` — add logs/**, confluence_data/logs/**, state_files/**, pytest_tmp/**
- `offline-folder-rag/edge_agent/app/api/routes.py` — include confluence_routes.router
- `offline-folder-rag/edge_agent/app/config/config.py` or config package — expose confluence_settings
- `offline-folder-rag/edge_agent/app/main.py` — register Confluence router
- `offline-folder-rag/edge_agent/app/logging/logger.py` — component loggers (backwards-compatible)
- `pytest.ini` — add confluence test paths
- `offline-folder-rag/requirements.txt`, root `requirements.txt` — add requests, pydantic if missing
- `docker-compose.yml` — volume mounts (if exists)
- `offline-folder-rag/vscode-extension/package.json` — confluence commands
- `offline-folder-rag/vscode-extension/src/extension.ts` — register Confluence commands

## Verification Commands
- `python -m compileall offline-folder-rag/edge_agent/app`
- `pytest -q`
- FastAPI app starts (uvicorn)

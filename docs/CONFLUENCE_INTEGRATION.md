# Confluence Integration

Confluence integration adds API routes and modules to publish content to Confluence.

- **Endpoints**: `GET /confluence/health`, `GET /confluence/spaces`, `POST /confluence/pages`
- **Config**: `confluence_data/config/default_config.json` and env vars (`CONFLUENCE_BASE_URL`, `CONFLUENCE_API_TOKEN` or `CONFLUENCE_BEARER_TOKEN`)
- **Templates**: `confluence_data/templates/*.json`
- **State**: `state_files/confluence_states/creation_sessions/`
- **Logs**: `logs/confluence/confluence_app.log`

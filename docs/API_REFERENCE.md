# API Reference

## Confluence (require X-LOCAL-TOKEN)

- **GET /confluence/health** — `{"status": "ok", "config_present": bool}`
- **GET /confluence/spaces** — `{"spaces": [...], "error": null|string}`
- **POST /confluence/pages** — Body: `{"space_key", "title", "content_blocks": [], "mode": "create"|"update", "parent_page_id"?: string}`. Response: `{"page_id", "url", "status", "error"?: string}`

All Confluence routes use the same token as the main API (`X-LOCAL-TOKEN`).

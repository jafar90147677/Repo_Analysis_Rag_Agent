-- Confluence tables (idempotent)
CREATE TABLE IF NOT EXISTS confluence_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    space_key TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS template_selections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_name TEXT NOT NULL,
    metadata_json TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agent_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_name TEXT NOT NULL,
    status TEXT NOT NULL,
    duration_ms INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
);

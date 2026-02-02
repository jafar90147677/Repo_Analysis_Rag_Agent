-- Intelligence extension (idempotent)
CREATE TABLE IF NOT EXISTS intelligence_extension (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value_json TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

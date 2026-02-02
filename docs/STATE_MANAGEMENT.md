# State Management

- **Creation sessions**: `state_files/confluence_states/creation_sessions/{session_id}.json` — state machine (INIT → ANALYSED → FORMATTED → SUBMITTED → DONE | FAILED)
- **Task queue**: `state_files/mcp/task_queue_state.json` — in-memory queue persistence
- **Page tracker**: `confluence_data/examples/successful_creations/page_tracker.json` — page metadata by repo_id/file_path

`state_files/` is gitignored.

import * as vscode from "vscode";

const PLACEHOLDER_TEXT = "Plan, @ for context, / for commands";

function getNonce(): string {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length: 16 })
        .map(() => possible.charAt(Math.floor(Math.random() * possible.length)))
        .join("");
}

export function getChatPanelHtml(_extensionUri: vscode.Uri, placeholderText: string = PLACEHOLDER_TEXT): string {
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';" />
    <title>Offline Folder RAG</title>
    <style>
        :root {
            color-scheme: light dark;
            --bg: #f5f6f7;
            --panel-bg: #ffffff;
            --surface: #f0f0f3;
            --border: #d0d0db;
            --muted: #6c6e77;
            --text: #111;
            --accent: #0e639c;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg: #08090c;
                --panel-bg: #1b1b1e;
                --surface: #23242a;
                --border: #3f4148;
                --muted: #9aa1b4;
                --text: #f4f4f5;
                --accent: #2ea3ff;
            }
        }

        body {
            margin: 0;
            padding: 0;
            background: var(--bg);
            font-family: "Segoe UI", system-ui, sans-serif;
            color: var(--text);
        }

        #chat-panel-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            padding: 20px;
            gap: 16px;
            box-sizing: border-box;
        }

        #chat-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border);
        }

        #header-titles h1 {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 600;
        }

        #header-titles p {
            margin: 2px 0 0;
            color: var(--muted);
            font-size: 0.85rem;
        }

        #header-actions {
            display: flex;
            gap: 8px;
        }

        #header-actions button {
            border: 1px solid var(--border);
            border-radius: 6px;
            width: 36px;
            height: 36px;
            font-size: 1.25rem;
            background: var(--surface);
            color: var(--text);
            cursor: pointer;
        }

        #header-actions button:hover,
        #header-actions button:focus-visible {
            border-color: var(--accent);
            outline: none;
            box-shadow: 0 0 0 2px rgba(14, 99, 156, 0.2);
        }

        #conversation {
            flex: 1;
            overflow-y: auto;
            background: var(--panel-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .conversation-empty {
            color: var(--muted);
            font-size: 0.95rem;
        }

        .conversation-message {
            padding: 10px 14px;
            border-radius: 10px;
            max-width: 80%;
            line-height: 1.4;
            border: 1px solid transparent;
            word-break: break-word;
        }

        .conversation-message.user {
            align-self: flex-end;
            background: rgba(14, 99, 156, 0.12);
            border-color: rgba(14, 99, 156, 0.3);
        }

        .conversation-message.assistant {
            align-self: flex-start;
            background: var(--surface);
            border-color: var(--border);
        }

        #composer-card {
            position: relative;
            background: var(--panel-bg);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 18px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        #composer-form {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        #composer-form label {
            font-weight: 600;
            font-size: 0.95rem;
        }

        #composer-input {
            width: 100%;
            min-height: 110px;
            border-radius: 12px;
            border: 1px solid var(--border);
            padding: 12px;
            background: var(--surface);
            color: var(--text);
            font-size: 1rem;
            resize: vertical;
        }

        #composer-input:focus-visible {
            outline: 2px solid var(--accent);
            border-color: transparent;
        }

        .composer-hint {
            margin: 0;
            font-size: 0.85rem;
            color: var(--muted);
        }

<<<<<<< HEAD
        .composer-hint strong {
            font-weight: 600;
=======
        .assistant-response {
            border-left: 2px solid #0e639c;
            padding-left: 12px;
            margin-bottom: 16px;
        }

        .chips-row {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
        }

        .chip {
            font-size: 10px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 4px;
            text-transform: uppercase;
        }

        .confidence-found { background: #28a745; color: white; }
        .confidence-partial { background: #ffc107; color: black; }
        .confidence-not_found { background: #dc3545; color: white; }

        .mode-rag { background: #6f42c1; color: white; }
        .mode-tools { background: #fd7e14; color: white; }
        .mode-hybrid { background: #007bff; color: white; }

        .answer-text {
            line-height: 1.5;
            margin-bottom: 12px;
        }

        .citations-list {
            font-size: 12px;
            color: #aaa;
        }

        .citations-list ul {
            list-style: none;
            padding: 0;
            margin: 4px 0;
        }

        .citation-link {
            color: #3794ff;
            text-decoration: none;
        }

        .citation-link:hover {
            text-decoration: underline;
        }

        #chat-panel-composer {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        textarea {
            width: 100%;
            background: #222;
            border: 1px solid #333;
            color: #eee;
            padding: 8px;
            resize: vertical;
            min-height: 60px;
>>>>>>> 31ecd6f019cdef3270a68e61b1c6464827aa0ee7
        }

        #composer-bottom-row {
            display: flex;
<<<<<<< HEAD
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
=======
            gap: 8px;
            align-items: center;
>>>>>>> 31ecd6f019cdef3270a68e61b1c6464827aa0ee7
        }

        .composer-dropdown {
            display: flex;
<<<<<<< HEAD
            flex-direction: column;
            font-size: 0.75rem;
            color: var(--muted);
        }

        .composer-dropdown label {
            font-size: 0.9rem;
            margin-bottom: 4px;
        }

        .composer-dropdown select {
            border-radius: 8px;
            border: 1px solid var(--border);
            background: var(--surface);
            padding: 6px 10px;
            font-size: 0.9rem;
            color: var(--text);
            min-width: 120px;
>>>>>>> 11924b0a8c312a8be3ae4b662385d77b7802e129
        }

        .context-attachments {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            min-height: 28px;
        }

        .context-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            border-radius: 999px;
            border: 1px solid var(--border);
            background: var(--surface);
            font-size: 0.85rem;
        }

        .context-chip button {
            border: none;
            background: transparent;
            color: var(--muted);
            cursor: pointer;
            font-size: 1rem;
            line-height: 1;
        }

        #context-menu {
            position: absolute;
            top: calc(100% + 8px);
            left: 16px;
            width: 220px;
            background: var(--panel-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
            padding: 8px 0;
            display: none;
            flex-direction: column;
            z-index: 2;
        }

        #context-menu.visible {
            display: flex;
        }

        #context-menu button {
            border: none;
            background: none;
            text-align: left;
            padding: 8px 16px;
            width: 100%;
            cursor: pointer;
            color: var(--text);
        }

        #context-menu button:hover,
        #context-menu button:focus-visible {
            background: var(--surface);
            outline: none;
        }

        .composer-dropdown {
            display: flex;
            flex-direction: column;
            font-size: 0.75rem;
            color: var(--muted);
        }

        .composer-dropdown label {
            font-size: 0.9rem;
            margin-bottom: 4px;
        }

        .composer-dropdown select {
            border-radius: 8px;
            border: 1px solid var(--border);
            background: var(--surface);
            padding: 6px 10px;
            font-size: 0.9rem;
            color: var(--text);
            min-width: 120px;
        }

        #composer-bottom-row {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }

        #composer-bottom-row button {
            border: 1px solid var(--border);
            border-radius: 8px;
            background: var(--surface);
            width: 40px;
            height: 40px;
            font-size: 1.2rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        #composer-bottom-row button:hover,
        #composer-bottom-row button:focus-visible {
            border-color: var(--accent);
            outline: none;
            box-shadow: 0 0 0 2px rgba(14, 99, 156, 0.2);
        }

        .composer-send-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .send-button {
            border: none;
            border-radius: 999px;
            padding: 8px 20px;
            background: var(--accent);
            color: #fff;
            font-weight: 600;
            cursor: pointer;
        }

        .send-button:focus-visible {
            outline: 2px solid rgba(46, 163, 255, 0.6);
        }

        .send-hint {
            color: var(--muted);
            font-size: 0.85rem;
        }

        #local-row {
            display: flex;
            align-items: center;
            gap: 12px;
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 8px 14px;
            background: var(--surface);
        }

        #local-row label {
            font-weight: 600;
        }

        #local-row select {
            border-radius: 8px;
            border: 1px solid var(--border);
            padding: 6px 10px;
            background: var(--panel-bg);
            color: var(--text);
            font-size: 0.9rem;
        }

        .modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10;
        }

        .modal-backdrop.visible {
            display: flex;
        }

        .modal {
            background: var(--panel-bg);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 20px;
            width: min(320px, 80%);
            text-align: center;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .modal-actions {
            display: flex;
            justify-content: center;
            gap: 10px;
        }

        .modal-actions button {
            padding: 8px 16px;
            border-radius: 8px;
            border: 1px solid var(--border);
            background: var(--surface);
            cursor: pointer;
        }

        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }
    </style>
</head>
<body>
    <div id="chat-panel-container">
        <header id="chat-panel-header">
            <div id="header-titles">
                <h1>Chat</h1>
                <p>Offline Folder RAG</p>
            </div>
            <div id="header-actions" role="toolbar" aria-label="Chat header actions">
                <button type="button" aria-label="Start a new conversation" title="Start new chat">+</button>
                <button type="button" aria-label="View more options" title="More options">…</button>
            </div>
        </header>

        <section id="conversation" role="log" aria-live="polite">
            <div id="empty-state" class="conversation-empty">No conversation yet.</div>
        </section>

        <section id="composer-card" aria-label="Chat composer">
            <form id="composer-form">
                <label for="composer-input">Message</label>
                <textarea
                    id="composer-input"
                    placeholder="${placeholderText}"
                    aria-label="Message input"
                    aria-describedby="composer-hint"
                    autocomplete="off"
                ></textarea>
                <p id="composer-hint" class="composer-hint">${placeholderText}</p>

                <div id="context-attachments" class="context-attachments" aria-live="polite" hidden></div>

                <div id="context-menu" class="context-menu" role="menu" aria-label="@ context menu">
                    <button type="button" data-action="folder">@folder</button>
                    <button type="button" data-action="selection">@selection</button>
                    <button type="button" data-action="file">@file</button>
                </div>

                <div id="composer-bottom-row" aria-label="Composer quick controls">
                    <div class="composer-dropdown">
                    <label for="infinity-dropdown">∞</label>
                    <select id="infinity-dropdown" aria-label="Infinity dropdown" title="Infinity options">
                        <option value="local" selected>Local</option>
                        <option value="future-1" disabled class="dropdown-future" aria-disabled="true">
                            Future entry 1 (coming soon)
                        </option>
                        <option value="future-2" disabled class="dropdown-future" aria-disabled="true">
                            Future entry 2 (coming soon)
                        </option>
                    </select>
                    </div>
                    <div class="composer-dropdown">
                        <label for="mode-select">Mode</label>
                        <select id="mode-select" aria-label="Composer mode" title="Composer mode selector">
                            <option value="auto">Auto</option>
                            <option value="rag">RAG</option>
                            <option value="tools">Tools</option>
                        </select>
                    </div>
                    <button id="attachment-button" type="button" aria-label="Attach file" title="Attach file">
                        📎
                    </button>
                    <button id="microphone-button" type="button" aria-label="Record voice" title="Record voice">
                        🎤
                    </button>
                </div>

                <div class="composer-send-row">
                    <button type="submit" class="send-button" aria-label="Send message" title="Send message">
                        Send
                    </button>
                    <span class="send-hint">Press Ctrl+Enter to send</span>
                </div>
            </form>
        </section>

        <div id="local-row">
            <label for="local-dropdown">Local</label>
            <select id="local-dropdown" aria-label="Local data source selector">
                <option value="__select_folder__">Select Folder…</option>
            </select>
        </div>
    </div>

    <div class="modal-backdrop" id="indexModal" role="dialog" aria-modal="true" aria-labelledby="indexModalTitle">
        <div class="modal">
            <p id="indexModalTitle"><strong>Index required</strong></p>
            <p>Run a full index to use gated commands.</p>
            <div class="modal-actions">
                <button id="indexFull" type="button" aria-label="Index full workspace" title="Index full workspace">Index Full</button>
                <button id="indexCancel" type="button" aria-label="Cancel indexing" title="Cancel indexing">Cancel</button>
            </div>
<<<<<<< HEAD
=======
        </header>

        <section id="conversation" role="log" aria-live="polite">
            <p>No conversation yet.</p>
        </section>

        <section id="chat-panel-composer">
            <label for="composer">Message</label>
            <textarea id="composer" placeholder="${placeholderText}"></textarea>
            <div id="composer-bottom-row">
                {/* ∞ Dropdown Scope */}
                <div class="composer-scope-dropdown">
                    <label for="scopeSelect" class="sr-only">Scope</label>
                    <select id="scopeSelect" data-testid="scope-dropdown">
                        <option value="Local">Local</option>
                        <option value="RAG" disabled>RAG</option>
                        <option value="Tools" disabled>Tools</option>
                    </select>
                </div>
                <div class="composer-dropdown">
                    <label for="autoModeSelect">Auto</label>
                    <select id="autoModeSelect">
                        <option value="Auto">Auto</option>
                        <option value="RAG">RAG</option>
                        <option value="Tools">Tools</option>
                    </select>
                </div>
                <button id="attachment-button" type="button">📎</button>
                <button id="microphone-button" type="button">🎤</button>
            </div>
        </section>
    </div>

    <div class="modal-backdrop" id="indexModal">
        <div class="modal">
            <p><strong>Index required. Run Full Index now?</strong></p>
            <button id="indexFull">Index Full</button>
            <button id="indexCancel">Cancel</button>
>>>>>>> 31ecd6f019cdef3270a68e61b1c6464827aa0ee7
=======
>>>>>>> bdbd261 (47)
        </div>
    </div>

    <script nonce="${nonce}">
        (function () {
            const vscode = acquireVsCodeApi();
            const conversation = document.getElementById("conversation");
            const composerForm = document.getElementById("composer-form");
            const composerInput = document.getElementById("composer-input");
            const contextAttachments = document.getElementById("context-attachments");
            const contextMenu = document.getElementById("context-menu");
            const modeSelect = document.getElementById("mode-select");
            const infinityDropdown = document.getElementById("infinity-dropdown");
            const indexModal = document.getElementById("indexModal");
            const indexFullButton = document.getElementById("indexFull");
            const indexCancelButton = document.getElementById("indexCancel");
            const LOCAL_SELECT_VALUE = "__select_folder__";
            const localDropdown = document.getElementById("local-dropdown");

            const COMPOSER_MODES = ["auto", "rag", "tools"];

            const attachedContext = {
                root_path: null,
                selection_text: null,
                active_file_paths: [],
            };

            let currentMode = "auto";
            let lastLocalSelection = LOCAL_SELECT_VALUE;

            function generateContextId() {
                return "ctx-" + Date.now() + "-" + Math.random().toString(16).slice(2);
            }

            function applyMode(newMode, notify = false) {
                if (!COMPOSER_MODES.includes(newMode)) {
                    return;
                }

                currentMode = newMode;
                if (modeSelect) {
                    modeSelect.value = newMode;
                }

                if (notify) {
                    vscode.postMessage({ type: "setMode", mode: newMode });
                }
            }

            if (modeSelect) {
                modeSelect.addEventListener("change", () => applyMode(modeSelect.value, true));
            }

            if (infinityDropdown) {
                infinityDropdown.value = "local";
                infinityDropdown.addEventListener("change", () => {
                    if (infinityDropdown.value !== "local") {
                        infinityDropdown.value = "local";
                    }
                });
            }

            function renderLocalOptions(state) {
                if (!localDropdown) {
                    return;
                }

                localDropdown.innerHTML = "<option value=\"" + LOCAL_SELECT_VALUE + "\">Select Folder…</option>";

                const seen = new Set();
                const rootPath = state?.rootPath;
                const recent = Array.isArray(state?.recentFolders) ? state.recentFolders : [];
                const additions = [];

                if (rootPath) {
                    seen.add(rootPath);
                    additions.push(rootPath);
                }

                for (const folder of recent) {
                    if (additions.length >= 10) {
                        break;
                    }

                    if (seen.has(folder)) {
                        continue;
                    }

                    seen.add(folder);
                    additions.push(folder);
                }

                for (const folder of additions) {
                    const option = document.createElement("option");
                    option.value = folder;
                    option.textContent = folder;
                    localDropdown.appendChild(option);
                }

                const targetValue = rootPath && seen.has(rootPath) ? rootPath : lastLocalSelection;

                if (targetValue && Array.from(localDropdown.options).some((opt) => opt.value === targetValue)) {
                    localDropdown.value = targetValue;
                    lastLocalSelection = targetValue;
                } else {
                    localDropdown.value = LOCAL_SELECT_VALUE;
                    lastLocalSelection = LOCAL_SELECT_VALUE;
                }
            }

            if (localDropdown) {
                localDropdown.addEventListener("change", () => {
                    const value = localDropdown.value;

                    if (value === LOCAL_SELECT_VALUE) {
                        vscode.postMessage({ type: "localPick" });
                        localDropdown.value = lastLocalSelection;
                        return;
                    }

                    lastLocalSelection = value;
                    vscode.postMessage({ type: "localSelect", folder: value });
                });
            }

            function appendMessage(text, role = "assistant") {
                if (!conversation || !text) {
                    return;
                }

                const emptyState = document.getElementById("empty-state");
                if (emptyState) {
                    emptyState.remove();
                }

                const entry = document.createElement("div");
                entry.className = "conversation-message " + role;
                entry.textContent = text;
                conversation.appendChild(entry);
                conversation.scrollTop = conversation.scrollHeight;
            }

            function createChip(label, value, type, id) {
                const chip = document.createElement("div");
                chip.className = "context-chip";

                const text = document.createElement("span");
                text.textContent = label + ": " + value;
                text.title = value;
                chip.appendChild(text);

                const removeButton = document.createElement("button");
                removeButton.setAttribute("type", "button");
                removeButton.dataset.removeType = type;
                if (id) {
                    removeButton.dataset.removeId = id;
                }
                removeButton.textContent = "×";
                removeButton.ariaLabel = "Remove " + label + " context";
                chip.appendChild(removeButton);

                return chip;
            }

            function renderAttachments() {
                if (!contextAttachments) {
                    return;
                }

                contextAttachments.innerHTML = "";

                if (attachedContext.root_path) {
                    contextAttachments.appendChild(
                        createChip("Folder", attachedContext.root_path, "folder")
                    );
                }

                if (attachedContext.selection_text) {
                    contextAttachments.appendChild(
                        createChip("Selection", attachedContext.selection_text, "selection")
                    );
                }

                attachedContext.active_file_paths.forEach((file) => {
                    contextAttachments.appendChild(createChip("File", file.path, "file", file.id));
                });

                contextAttachments.hidden = !contextAttachments.children.length;
            }

            function clearContext() {
                attachedContext.root_path = null;
                attachedContext.selection_text = null;
                attachedContext.active_file_paths = [];
                renderAttachments();
            }

            function buildExtraContext() {
                const extra = {};

                if (attachedContext.root_path) {
                    extra.root_path = attachedContext.root_path;
                }

                if (attachedContext.selection_text) {
                    extra.selection_text = attachedContext.selection_text;
                }

                if (attachedContext.active_file_paths.length) {
                    extra.active_file_paths = attachedContext.active_file_paths.map((entry) => entry.path);
                }

                return Object.keys(extra).length ? extra : undefined;
            }

            function handleContextResponse(message) {
                if (!message || message.error || !message.context) {
                    return;
                }

                if (message.action === "folder" && message.context.root_path) {
                    attachedContext.root_path = message.context.root_path;
                } else if (message.action === "selection" && message.context.selection_text) {
                    attachedContext.selection_text = message.context.selection_text;
                } else if (message.action === "file" && message.context.active_file_path) {
                    attachedContext.active_file_paths.push({
                        id: generateContextId(),
                        path: message.context.active_file_path,
                    });
                }

                renderAttachments();
            }

            function showContextMenu() {
                if (contextMenu) {
                    contextMenu.classList.add("visible");
                }
            }

            function hideContextMenu() {
                if (contextMenu) {
                    contextMenu.classList.remove("visible");
                }
            }

            function sendCommand() {
                if (!composerInput) {
                    return;
                }

                const trimmed = composerInput.value.trim();
                if (!trimmed) {
                    return;
                }

                appendMessage(trimmed, "user");
                const extraContext = buildExtraContext();
                vscode.postMessage({
                    type: "command",
                    text: trimmed,
                    mode: currentMode,
                    extraContext,
                });
                composerInput.value = "";
                composerInput.focus();
                clearContext();
                hideContextMenu();
            }

            composerForm?.addEventListener("submit", (event) => {
                event.preventDefault();
                sendCommand();
            });

            composerInput?.addEventListener("input", () => {
                if (composerInput.value.endsWith("@")) {
                    showContextMenu();
                }
            });

            composerInput?.addEventListener("keydown", (event) => {
                if (event.key === "@") {
                    showContextMenu();
                }

                if (event.key === "Escape") {
                    hideContextMenu();
                }

                if (event.key !== "Enter") {
                    return;
                }

                if (event.shiftKey) {
                    return;
                }

                event.preventDefault();
                sendCommand();
            });

            contextMenu?.addEventListener("click", (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }

                const action = target.dataset.action;
                if (!action) {
                    return;
                }

                vscode.postMessage({ type: "contextRequest", action });
                hideContextMenu();
                composerInput?.focus();
            });

            contextAttachments?.addEventListener("click", (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }

                const button = target.closest("button[data-remove-type]");
                if (!(button instanceof HTMLElement)) {
                    return;
                }

                const type = button.dataset.removeType;
                const removeId = button.dataset.removeId;

                if (type === "folder") {
                    attachedContext.root_path = null;
                } else if (type === "selection") {
                    attachedContext.selection_text = null;
                } else if (type === "file" && removeId) {
                    attachedContext.active_file_paths = attachedContext.active_file_paths.filter(
                        (entry) => entry.id !== removeId
                    );
                }

                renderAttachments();
            });

            document.addEventListener("click", (event) => {
                if (!contextMenu) {
                    return;
                }

                if (contextMenu.contains(event.target)) {
                    return;
                }

                if (event.target === composerInput) {
                    return;
                }

                hideContextMenu();
            });

            indexFullButton?.addEventListener("click", () => {
                vscode.postMessage({ type: "indexAction", action: "full" });
            });

            indexCancelButton?.addEventListener("click", () => {
                vscode.postMessage({ type: "indexAction", action: "cancel" });
            });

            window.addEventListener("message", (event) => {
                const message = event.data;
                if (!message) {
                    return;
                }

                if (message.type === "modeState" && typeof message.mode === "string") {
                    applyMode(message.mode);
                    return;
                }

                if (message.type === "localState") {
                    renderLocalOptions({
                        rootPath: message.rootPath,
                        recentFolders: message.recentFolders,
                    });
                    return;
                }

                if (message.type === "contextResponse") {
                    handleContextResponse(message);
                    return;
                }

                if (message.type === "showIndexModal" && indexModal) {
                    indexModal.classList.add("visible");
                    return;
                }

                if (message.type === "dismissIndexModal" && indexModal) {
                    indexModal.classList.remove("visible");
                    return;
                }

                if (message.type === "commandResult" && message.payload) {
                    appendMessage(message.payload, "assistant");
                }
            });

            renderAttachments();
        })();
<<<<<<< HEAD
=======
        const vscode = acquireVsCodeApi();
        const conversation = document.getElementById("conversation");
        const composer = document.getElementById("composer");
        const autoModeSelect = document.getElementById("autoModeSelect");
        const modal = document.getElementById("indexModal");
        const indexFullButton = document.getElementById("indexFull");
        const indexCancelButton = document.getElementById("indexCancel");

        function appendLog(text, isHtml = false) {
            const entry = document.createElement("div");
            if (isHtml) {
                entry.innerHTML = text;
            } else {
                entry.textContent = text;
            }
            conversation.appendChild(entry);
            conversation.scrollTop = conversation.scrollHeight;
        }

        function showModal() {
            modal.style.display = "flex";
        }

        function hideModal() {
            modal.style.display = "none";
        }

        composer.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                if (event.shiftKey) {
                    return;
                }
                event.preventDefault();
                const text = composer.value.trim();
                const mode = autoModeSelect.value;
                if (text) {
                    appendLog("> " + text);
                    vscode.postMessage({ type: "command", text: text, mode: mode });
                    composer.value = "";
                }
            }
        });

        indexFullButton.addEventListener("click", () => {
            vscode.postMessage({ type: "indexAction", action: "full" });
        });

        indexCancelButton.addEventListener("click", () => {
            vscode.postMessage({ type: "indexAction", action: "cancel" });
        });

        window.addEventListener("message", (event) => {
            const message = event.data;
            if (!message) return;

            if (message.type === "showIndexModal") {
                showModal();
            } else if (message.type === "dismissIndexModal") {
                hideModal();
            } else if (message.type === "commandResult" && message.payload) {
                appendLog(message.payload, message.isHtml);
            }
        });

        document.addEventListener('click', (event) => {
            const target = event.target;
            if (target && target.classList.contains('citation-link')) {
                event.preventDefault();
                const path = target.getAttribute('data-path');
                const start = parseInt(target.getAttribute('data-start'));
                const end = parseInt(target.getAttribute('data-end'));
                vscode.postMessage({ type: 'openCitation', path, start, end });
            }
        });
>>>>>>> 31ecd6f019cdef3270a68e61b1c6464827aa0ee7
=======
>>>>>>> bdbd261 (47)
    </script>
</body>
</html>`;
}

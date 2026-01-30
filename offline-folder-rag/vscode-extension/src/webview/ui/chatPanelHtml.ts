import * as vscode from "vscode";

const PLACEHOLDER_TEXT = "Plan, @ for context, / for commands";

function getNonce(): string {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let text = "";
    for (let i = 0; i < 16; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export function getChatPanelHtml(extensionUri: vscode.Uri, placeholderText: string = PLACEHOLDER_TEXT): string {
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-\${nonce}'; style-src 'unsafe-inline';" />
    <title>Offline Folder RAG</title>
    <style>
        :root {
            color-scheme: light dark;
            --bg: #f4f4f5;
            --panel-bg: #ffffff;
            --surface: #f0f0f3;
            --border: #d0d0db;
            --muted: #6c6e77;
            --text: #111;
            --accent: #0e639c;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg: #0b0c10;
                --panel-bg: #16181c;
                --surface: #1e2027;
                --border: #3a3d46;
                --muted: #9ea4b9;
                --text: #f5f6f8;
                --accent: #2ea3ff;
            }
        }

        body {
            margin: 0;
            background: var(--bg);
            font-family: "Segoe UI", system-ui, sans-serif;
            color: var(--text);
        }

        #chat-panel-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            padding: 16px;
            box-sizing: border-box;
            gap: 16px;
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
            border-radius: 8px;
            width: 36px;
            height: 36px;
            font-size: 1.25rem;
            background: var(--surface);
            color: var(--text);
            cursor: pointer;
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
            word-break: break-word;
        }

        .conversation-message.user {
            align-self: flex-end;
            background: rgba(14, 99, 156, 0.12);
            border: 1px solid rgba(14, 99, 156, 0.3);
        }

        .conversation-message.assistant {
            align-self: flex-start;
            background: var(--surface);
            border: 1px solid var(--border);
        }

        #composer-card {
            background: var(--panel-bg);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 18px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
            display: flex;
            flex-direction: column;
            gap: 12px;
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
            min-height: 120px;
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

        #composer-bottom-row {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
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
            font-weight: 500;
        }

        .composer-dropdown select {
            border-radius: 8px;
            border: 1px solid var(--border);
            background: var(--surface);
            padding: 6px 10px;
            font-size: 0.95rem;
            color: var(--text);
            min-width: 120px;
        }

        #composer-bottom-row button {
            border: 1px solid var(--border);
            border-radius: 10px;
            background: var(--surface);
            width: 40px;
            height: 40px;
            font-size: 1.4rem;
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
            padding: 10px 26px;
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

        .context-attachments {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            min-height: 28px;
        }

        .context-attachments.hidden {
            display: none;
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
            width: 180px;
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
                    placeholder="\${placeholderText}"
                    aria-label="Message input"
                    autocomplete="off"
                ></textarea>
                <p class="composer-hint">\${placeholderText}</p>

                <div id="context-attachments" class="context-attachments hidden" aria-live="polite"></div>

                <div id="context-menu" role="menu" aria-label="@ context menu">
                    <button type="button" data-action="folder">@folder</button>
                    <button type="button" data-action="selection">@selection</button>
                    <button type="button" data-action="file">@file</button>
                </div>

                <div id="composer-bottom-row" aria-label="Composer quick controls">
                    <div class="composer-dropdown">
                        <label for="infinity-dropdown">∞</label>
                        <select id="infinity-dropdown" aria-label="Infinity dropdown">
                            <option value="local" selected>Local</option>
                            <option value="future-1" disabled>Future entry 1</option>
                            <option value="future-2" disabled>Future entry 2</option>
                        </select>
                    </div>
                    <div class="composer-dropdown">
                        <label for="mode-select">Mode</label>
                        <select id="mode-select" aria-label="Composer mode">
                            <option value="auto">Auto</option>
                            <option value="rag">RAG</option>
                            <option value="tools">Tools</option>
                        </select>
                    </div>
                    <button id="attachment-button" type="button" aria-label="Attach file" title="Attach file">📎</button>
                    <button id="microphone-button" type="button" aria-label="Record voice" title="Record voice">🎤</button>
                </div>

                <div class="composer-send-row">
                    <button type="submit" class="send-button" aria-label="Send message" title="Send message">Send</button>
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
        </div>
    </div>

    <script nonce="\${nonce}">
        (function () {
            const vscode = acquireVsCodeApi();
            const composerForm = document.getElementById("composer-form");
            const composerInput = document.getElementById("composer-input");
            const modeSelect = document.getElementById("mode-select");
            const conversation = document.getElementById("conversation");
            const emptyState = document.getElementById("empty-state");
            const contextAttachments = document.getElementById("context-attachments");
            const contextMenu = document.getElementById("context-menu");
            const infinityDropdown = document.getElementById("infinity-dropdown");
            const attachmentButton = document.getElementById("attachment-button");
            const indexModal = document.getElementById("indexModal");
            const indexFullButton = document.getElementById("indexFull");
            const indexCancelButton = document.getElementById("indexCancel");
            const localDropdown = document.getElementById("local-dropdown");

            const attachedContext = {
                root_path: null,
                selection_text: null,
                active_file_path: null,
            };

            function appendMessage(text, role, isHtml = false) {
                if (!conversation || !text) return;

                if (emptyState) {
                    emptyState.remove();
                }

                const entry = document.createElement("div");
                entry.className = "conversation-message " + role;
                if (isHtml) {
                    entry.innerHTML = text;
                } else {
                    entry.textContent = text;
                }
                conversation.appendChild(entry);
                conversation.scrollTop = conversation.scrollHeight;
            }

            function createChip(label, value, key) {
                const chip = document.createElement("div");
                chip.className = "context-chip";

                const text = document.createElement("span");
                text.textContent = label + ": " + value;
                chip.appendChild(text);

                const remove = document.createElement("button");
                remove.type = "button";
                remove.dataset.key = key;
                remove.textContent = "×";
                chip.appendChild(remove);

                return chip;
            }

            function renderAttachments() {
                if (!contextAttachments) return;
                contextAttachments.innerHTML = "";

                if (attachedContext.root_path) {
                    contextAttachments.appendChild(createChip("Folder", attachedContext.root_path, "root_path"));
                }
                if (attachedContext.selection_text) {
                    contextAttachments.appendChild(createChip("Selection", attachedContext.selection_text, "selection_text"));
                }
                if (attachedContext.active_file_path) {
                    contextAttachments.appendChild(createChip("File", attachedContext.active_file_path, "active_file_path"));
                }

                contextAttachments.classList.toggle("hidden", contextAttachments.children.length === 0);
            }

            function buildExtraContext() {
                const extra = {};
                if (attachedContext.root_path) extra.root_path = attachedContext.root_path;
                if (attachedContext.selection_text) extra.selection_text = attachedContext.selection_text;
                if (attachedContext.active_file_path) extra.active_file_path = attachedContext.active_file_path;
                return Object.keys(extra).length ? extra : undefined;
            }

            function clearContext() {
                attachedContext.root_path = null;
                attachedContext.selection_text = null;
                attachedContext.active_file_path = null;
                renderAttachments();
            }

            function showContextMenu() {
                contextMenu?.classList.add("visible");
            }

            function hideContextMenu() {
                contextMenu?.classList.remove("visible");
            }

            function sendMessage() {
                if (!composerInput) return;
                const text = composerInput.value.trim();
                if (!text) return;

                appendMessage(text, "user");
                const mode = modeSelect?.value || "auto";
                const extraContext = buildExtraContext();

                vscode.postMessage({
                    type: "dispatch",
                    text,
                    mode,
                    extraContext,
                });

                composerInput.value = "";
                composerInput.focus();
                clearContext();
            }

            composerForm?.addEventListener("submit", (event) => {
                event.preventDefault();
                sendMessage();
            });

            composerInput?.addEventListener("keydown", (event) => {
                if (event.key === "@") showContextMenu();
                if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                }
            });

            composerInput?.addEventListener("input", () => {
                if (composerInput.value.endsWith("@")) showContextMenu();
            });

            modeSelect?.addEventListener("change", () => {
                vscode.postMessage({ type: "modeChange", mode: modeSelect.value });
            });

            if (infinityDropdown) {
                infinityDropdown.addEventListener("change", () => {
                    if (infinityDropdown.value !== "local") infinityDropdown.value = "local";
                });
            }

            attachmentButton?.addEventListener("click", () => {
                vscode.postMessage({ type: "attachment" });
            });

            contextMenu?.addEventListener("click", (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) return;
                const action = target.dataset.action;
                if (!action) return;
                vscode.postMessage({ type: "contextRequest", action });
                hideContextMenu();
                composerInput?.focus();
            });

            contextAttachments?.addEventListener("click", (event) => {
                const button = event.target.closest("button[data-key]");
                if (!(button instanceof HTMLElement)) return;
                const key = button.dataset.key;
                if (key) {
                    attachedContext[key] = null;
                    renderAttachments();
                }
            });

            document.addEventListener("click", (event) => {
                if (!contextMenu || !composerInput) return;
                if (!contextMenu.contains(event.target) && event.target !== composerInput) {
                    hideContextMenu();
                }
            });

            indexFullButton?.addEventListener("click", () => {
                vscode.postMessage({ type: "indexAction", action: "full" });
            });

            indexCancelButton?.addEventListener("click", () => {
                vscode.postMessage({ type: "indexAction", action: "cancel" });
            });

            window.addEventListener("message", (event) => {
                const message = event.data;
                if (!message) return;

                if (message.type === "insertText" && typeof message.payload === "string") {
                    if (composerInput) {
                        composerInput.value += (composerInput.value ? " " : "") + message.payload;
                        composerInput.focus();
                    }
                } else if (message.type === "commandResult" && message.payload) {
                    appendMessage(message.payload, "assistant", Boolean(message.isHtml));
                } else if (message.type === "modeState" && typeof message.mode === "string") {
                    if (modeSelect) modeSelect.value = message.mode;
                } else if (message.type === "contextResponse") {
                    if (message.error) {
                        appendMessage(message.error, "assistant");
                    } else {
                        const ctx = message.context ?? {};
                        if (message.action === "folder") attachedContext.root_path = ctx.root_path;
                        if (message.action === "selection") attachedContext.selection_text = ctx.selection_text;
                        if (message.action === "file") attachedContext.active_file_path = ctx.active_file_path;
                        renderAttachments();
                    }
                } else if (message.type === "showIndexModal") {
                    indexModal?.classList.add("visible");
                } else if (message.type === "dismissIndexModal") {
                    indexModal?.classList.remove("visible");
                }
            });

            document.addEventListener('click', (event) => {
                const target = event.target;
                if (target && target instanceof HTMLElement && target.classList.contains('citation-link')) {
                    event.preventDefault();
                    const path = target.getAttribute('data-path');
                    const start = parseInt(target.getAttribute('data-start') || "0");
                    const end = parseInt(target.getAttribute('data-end') || "0");
                    vscode.postMessage({ type: 'openCitation', path, start, end });
                }
            });

            renderAttachments();
        })();
    </script>
</body>
</html>\`;
}

import * as vscode from "vscode";

const PLACEHOLDER_TEXT = "Plan, @ for context, / for commands";

function getNonce(): string {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length: 16 })
        .map(() => possible.charAt(Math.floor(Math.random() * possible.length)))
        .join("");
}

export function getChatPanelHtml(extensionUri: vscode.Uri, placeholderText: string = PLACEHOLDER_TEXT): string {
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';" />
    <title>Offline Folder RAG</title>
    <style>
        body {
            font-family: system-ui, sans-serif;
            padding: 0;
            margin: 0;
            background: #111;
            color: #eee;
        }

        #chat-panel-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            padding: 16px;
            box-sizing: border-box;
            gap: 12px;
        }

        #conversation {
            flex: 1;
            overflow-y: auto;
            border: 1px solid #333;
            padding: 12px;
            background: #1b1b1b;
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
        }

        #composer-bottom-row {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .composer-dropdown {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        select {
            background: #222;
            color: #eee;
            border: 1px solid #333;
        }

        button {
            padding: 4px 8px;
            background: #0e639c;
            border: none;
            color: #fff;
            cursor: pointer;
        }

        .modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.75);
            display: none;
            align-items: center;
            justify-content: center;
        }

        .modal {
            background: #222;
            border: 1px solid #444;
            padding: 20px;
            max-width: 320px;
            text-align: center;
            display: flex;
            flex-direction: column;
            gap: 12px;
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
        </header>

        <section id="conversation" role="log" aria-live="polite">
            <p>No conversation yet.</p>
        </section>

        <section id="chat-panel-composer">
            <label for="composer">Message</label>
            <textarea id="composer" placeholder="${placeholderText}"></textarea>
            <div id="composer-bottom-row">
                <div class="composer-dropdown">
                    <label for="infinity-dropdown">∞</label>
                    <select id="infinity-dropdown">
                        <option value="1">∞ option</option>
                    </select>
                </div>
                <div class="composer-dropdown">
                    <label for="auto-dropdown">Auto</label>
                    <select id="auto-dropdown">
                        <option value="auto">Auto</option>
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
        </div>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        const conversation = document.getElementById("conversation");
        const composer = document.getElementById("composer");
        const modal = document.getElementById("indexModal");
        const indexFullButton = document.getElementById("indexFull");
        const indexCancelButton = document.getElementById("indexCancel");

        function appendLog(text) {
            const entry = document.createElement("p");
            entry.textContent = text;
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
                if (text) {
                    appendLog("> " + text);
                    vscode.postMessage({ type: "command", text: text });
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
                appendLog(message.payload);
            }
        });
    </script>
</body>
</html>`;
}

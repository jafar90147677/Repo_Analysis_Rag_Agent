<<<<<<< HEAD
const PLACEHOLDER_TEXT = "Plan, @ for context, / for commands";

function getNonce(): string {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length: 16 })
        .map(() => possible.charAt(Math.floor(Math.random() * possible.length)))
        .join("");
}

export function getChatPanelHtml(_: vscode.Uri): string {
    const nonce = getNonce();
=======
export function getChatPanelHtml(placeholderText: string, localRowHtml: string): string {
>>>>>>> abb8a4848decc5461e8c53c1ab70cb76bdef6e54
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';" />
    <title>Offline Folder RAG</title>
    <style>
        body {
<<<<<<< HEAD
            font-family: system-ui, sans-serif;
            padding: 0;
            margin: 0;
            background: #111;
            color: #eee;
        }

        main {
            display: flex;
            flex-direction: column;
            height: 100vh;
            gap: 12px;
            padding: 16px;
        }

        #chatLog {
            flex: 1;
            overflow-y: auto;
            border: 1px solid #333;
            padding: 12px;
            background: #1b1b1b;
        }

        #commandForm {
            display: flex;
            gap: 8px;
        }

        input {
            flex: 1;
            background: #222;
            border: 1px solid #333;
            color: #eee;
            padding: 8px;
        }

        button {
            padding: 8px 12px;
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
=======
            margin: 0;
            font-family: sans-serif;
        }

        #chat-panel-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            padding: 16px;
            box-sizing: border-box;
        }

        #conversation {
            flex: 1;
            overflow-y: auto;
            border-top: 1px solid #ccc;
            padding-top: 12px;
>>>>>>> abb8a4848decc5461e8c53c1ab70cb76bdef6e54
        }
    </style>
</head>
<body>
<<<<<<< HEAD
    <main>
        <div id="chatLog" role="log" aria-live="polite"></div>
        <form id="commandForm">
            <input type="text" id="commandInput" placeholder="${PLACEHOLDER_TEXT}" autocomplete="off" />
            <button type="submit">Send</button>
        </form>
    </main>

    <div class="modal-backdrop" id="indexModal">
        <div class="modal">
            <p><strong>Index required. Run Full Index now?</strong></p>
            <button id="indexFull">Index Full</button>
            <button id="indexCancel">Cancel</button>
        </div>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        const log = document.getElementById("chatLog");
        const form = document.getElementById("commandForm");
        const input = document.getElementById("commandInput");
        const modal = document.getElementById("indexModal");
        const indexFullButton = document.getElementById("indexFull");
        const indexCancelButton = document.getElementById("indexCancel");

        function appendLog(text) {
            const entry = document.createElement("p");
            entry.textContent = text;
            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
        }

        function showModal() {
            modal.style.display = "flex";
        }

        function hideModal() {
            modal.style.display = "none";
        }

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            if (!input.value.trim()) {
                return;
            }

            appendLog(`> ${input.value.trim()}`);
            vscode.postMessage({ type: "command", text: input.value.trim() });
            input.value = "";
        });

        indexFullButton.addEventListener("click", () => {
            vscode.postMessage({ type: "indexAction", action: "full" });
        });

        indexCancelButton.addEventListener("click", () => {
            vscode.postMessage({ type: "indexAction", action: "cancel" });
        });

        window.addEventListener("message", (event) => {
            const message = event.data;
            if (!message) {
                return;
            }

            if (message.type === "showIndexModal") {
                showModal();
            } else if (message.type === "dismissIndexModal") {
                hideModal();
            } else if (message.type === "commandResult" && message.payload) {
                appendLog(message.payload);
            }
        });
    </script>
=======
    <div id="chat-panel-container">
        <header id="chat-panel-header">
            <div id="header-titles">
                <h1>Chat</h1>
                <p>Offline Folder RAG</p>
            </div>
            <div id="header-actions" role="toolbar" aria-label="Chat header actions">
                <button type="button" aria-label="Start new chat">+</button>
                <button type="button" aria-label="More options">…</button>
            </div>
        </header>

        <section id="chat-panel-composer">
            <label for="composer">Message</label>
            <textarea id="composer" placeholder="${placeholderText}"></textarea>
            <div id="composer-bottom-row">
                <div class="composer-dropdown">
                    <label for="infinity-dropdown">∞</label>
                    <select id="infinity-dropdown" aria-label="Infinity options">
                        <option value="1">∞ option</option>
                    </select>
                </div>
                <div class="composer-dropdown">
                    <label for="auto-dropdown">Auto</label>
                    <select id="auto-dropdown" aria-label="Auto options">
                        <option value="auto">Auto</option>
                    </select>
                </div>
                <button id="attachment-button" type="button" aria-label="Attach file">📎</button>
                <button id="microphone-button" type="button" aria-label="Record voice">🎤</button>
            </div>
        </section>

        ${localRowHtml}

        <section id="conversation" role="log" aria-live="polite">
            <p>No conversation yet.</p>
        </section>
    </div>
>>>>>>> abb8a4848decc5461e8c53c1ab70cb76bdef6e54
</body>
</html>`;
}

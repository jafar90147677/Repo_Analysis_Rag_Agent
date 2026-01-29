export function getChatPanelHtml(placeholderText: string, localRowHtml: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none';" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Offline Folder RAG</title>
    <style>
        body {
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
</body>
</html>`;
}

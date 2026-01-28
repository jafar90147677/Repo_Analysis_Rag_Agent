import * as vscode from "vscode";

const PLACEHOLDER_TEXT = "Plan, @ for context, / for commands";

export function getChatPanelHtml(_: vscode.Uri): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none';" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Offline Folder RAG</title>
</head>
<body>
    <main>
        <label for="composer">Message</label>
        <textarea id="composer" placeholder="${PLACEHOLDER_TEXT}"></textarea>
    </main>
</body>
</html>`;
}

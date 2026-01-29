// @ts-nocheck
import * as vscode from "vscode";

import { getChatPanelHtml } from "./ui/chatPanelHtml";

export class ChatPanelViewProvider {
    private panel: vscode.WebviewPanel | undefined;
    private readonly extensionUri: vscode.Uri;

    constructor(extensionUri: vscode.Uri) {
        this.extensionUri = extensionUri;
    }

    public show(): void {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            "offlineFolderRag.chat",
            "Offline Folder RAG",
            vscode.ViewColumn.One,
            {
                enableScripts: false,
            }
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });

        const composerPlaceholder = "Plan, @ for context, / for commands";
        const localRowHtml = `
            <div id="local-row">
                <label for="local-dropdown">Local</label>
                <select id="local-dropdown" aria-label="Local options">
                    <option value="default">Default source</option>
                </select>
            </div>
        `;

        this.panel.webview.html = getChatPanelHtml(composerPlaceholder, localRowHtml);
    }
}

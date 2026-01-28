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

        this.panel.webview.html = getChatPanelHtml(this.extensionUri);
    }
}

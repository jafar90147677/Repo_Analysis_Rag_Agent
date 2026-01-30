// @ts-nocheck
import * as vscode from "vscode";

import { parseSlashCommand, CommandResultMessage } from "../commands/commandRouter";
import { getChatPanelHtml } from "./ui/chatPanelHtml";
import { triggerFullIndex, setIndexing, clearIndexing } from "../services/indexGate";

export class ChatPanelViewProvider {
    private panel: vscode.WebviewPanel | undefined;

    constructor(
        private readonly extensionContext: vscode.ExtensionContext,
        private readonly extensionUri: vscode.Uri
    ) {}

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
                enableScripts: true,
            }
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });

        this.panel.webview.onDidReceiveMessage(async (message) => {
            if (message.type === "command") {
                const result = await parseSlashCommand(message.text, this.extensionContext);
                this.postMessage(result);
            } else if (message.type === "indexAction") {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders || workspaceFolders.length === 0) return;
                const rootPath = workspaceFolders[0].uri.fsPath;

                if (message.action === "full") {
                    this.postMessage({ type: "dismissIndexModal" });
                    setIndexing(rootPath);
                    try {
                        await triggerFullIndex(
                            { storageRoot: this.extensionContext.globalStorageUri.fsPath },
                            rootPath,
                            (msg) => this.postMessage({ type: "commandResult", payload: msg })
                        );
                    } finally {
                        clearIndexing(rootPath);
                    }
                } else if (message.action === "cancel") {
                    this.postMessage({ type: "dismissIndexModal" });
                    this.postMessage({ type: "commandResult", payload: "Index not available; cannot answer" });
                }
            }
        });

        const composerPlaceholder = "Plan, @ for context, / for commands";
        this.panel.webview.html = getChatPanelHtml(this.extensionUri, composerPlaceholder);
    }

    private postMessage(message: CommandResultMessage): void {
        this.panel?.webview.postMessage(message);
    }
}

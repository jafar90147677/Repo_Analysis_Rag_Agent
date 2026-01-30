// @ts-nocheck
import * as vscode from "vscode";

import { parseSlashCommand, CommandResultMessage } from "../commands/commandRouter";
import { getChatPanelHtml } from "./ui/chatPanelHtml";
import { triggerFullIndex, setIndexing, clearIndexing } from "../services/indexGate";
import { renderAssistantResponse } from "./components/AssistantResponseRenderer";

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
                if (result.type === 'assistantResponse') {
                    const html = renderAssistantResponse(result.payload);
                    this.postMessage({ type: 'commandResult', payload: html, isHtml: true });
                } else {
                    this.postMessage(result);
                }
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
            } else if (message.type === "openCitation") {
                const { path: filePath, start, end } = message;
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders && workspaceFolders.length > 0) {
                    const fullPath = vscode.Uri.joinPath(workspaceFolders[0].uri, filePath);
                    const doc = await vscode.workspace.openTextDocument(fullPath);
                    const editor = await vscode.window.showTextDocument(doc);
                    const range = new vscode.Range(start - 1, 0, end - 1, 0);
                    editor.selection = new vscode.Selection(range.start, range.end);
                    editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
                }
            }
        });

        const composerPlaceholder = "Plan, @ for context, / for commands";
        this.panel.webview.html = getChatPanelHtml(this.extensionUri, composerPlaceholder);
    }

    private postMessage(message: any): void {
        this.panel?.webview.postMessage(message);
    }
}

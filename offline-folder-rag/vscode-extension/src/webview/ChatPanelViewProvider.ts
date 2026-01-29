// @ts-nocheck
import * as vscode from "vscode";

import { CommandRouter, CommandResultMessage } from "../commands/commandRouter";
import { getChatPanelHtml } from "./ui/chatPanelHtml";
import { startHealthPolling, stopHealthPolling, HealthResponse } from "../services/agentClient";

export class ChatPanelViewProvider {
    private panel: vscode.WebviewPanel | undefined;
    private readonly router: CommandRouter;
    private readonly agentBaseUrl = "http://localhost:8000"; // Default agent URL

    constructor(
        private readonly extensionContext: vscode.ExtensionContext,
        private readonly extensionUri: vscode.Uri
    ) {
        this.router = new CommandRouter(extensionContext, (message) => this.postMessage(message));
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
                enableScripts: true,
            }
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });

<<<<<<< HEAD
        this.panel.webview.html = getChatPanelHtml(this.extensionUri);

        this.panel.webview.onDidReceiveMessage(async (message: { type: string; [key: string]: any }) => {
            if (message.type === "command") {
                await this.router.route(message.text ?? "");
            } else if (message.type === "indexAction") {
                if (message.action === "full") {
                    this.startPolling();
                }
                await this.router.handleIndexAction(message.action);
            }
        });
    }

    private startPolling(): void {
        startHealthPolling(
            this.agentBaseUrl,
            (health: HealthResponse) => {
                let progressText = "";
                if (health.estimated_total_files > 0) {
                    progressText = `Indexing: ${health.indexed_files_so_far} files processed`;
                } else {
                    progressText = "Scanning...";
                }
                this.postMessage({
                    type: "commandResult",
                    payload: progressText
                });
            },
            (error) => {
                this.postMessage({
                    type: "commandResult",
                    payload: `Polling error: ${error.message}`
                });
            }
        );
    }

    private postMessage(message: CommandResultMessage): void {
        if (!this.panel) {
            return;
        }

        this.panel.webview.postMessage(message);
=======
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
>>>>>>> abb8a4848decc5461e8c53c1ab70cb76bdef6e54
    }
}

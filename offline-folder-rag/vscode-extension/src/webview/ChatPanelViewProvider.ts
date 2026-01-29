// @ts-nocheck
import * as vscode from "vscode";

import { CommandRouter, CommandResultMessage } from "../commands/commandRouter";
import { getChatPanelHtml } from "./ui/chatPanelHtml";

export class ChatPanelViewProvider {
    private panel: vscode.WebviewPanel | undefined;
    private readonly router: CommandRouter;

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
                await this.router.handleIndexAction(message.action);
            }
        });
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

// @ts-nocheck
import * as vscode from "vscode";

import { CommandRouter, CommandResultMessage } from "../commands/commandRouter";
import { getChatPanelHtml } from "./ui/chatPanelHtml";
import { askWithOverride } from "../services/agentClient";

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

        this.panel.webview.onDidReceiveMessage(async (message) => {
            if (message.type === "command") {
                const { text, mode } = message;
                if (mode === "RAG" && !text.startsWith("/")) {
                    try {
                        const response = await askWithOverride(text, "rag");
                        const result = await response.json();
                        this.postMessage({
                            type: "commandResult",
                            payload: result.answer || JSON.stringify(result),
                        });
                    } catch (error) {
                        this.postMessage({
                            type: "commandResult",
                            payload: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        });
                    }
                } else if (mode === "Auto" && !text.startsWith("/")) {
                    try {
                        await this.router.autoRouteInput(text);
                    } catch (error) {
                        this.postMessage({
                            type: "commandResult",
                            payload: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        });
                    }
                } else {
                    await this.router.handleCommand(text);
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

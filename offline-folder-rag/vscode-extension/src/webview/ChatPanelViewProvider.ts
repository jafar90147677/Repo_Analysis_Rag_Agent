// @ts-nocheck
import * as path from "path";
import * as vscode from "vscode";

import { CommandRouter, CommandResultMessage } from "../commands/commandRouter";
import { getChatPanelHtml } from "./ui/chatPanelHtml";
import {
    ComposerMode,
    isComposerMode,
    readComposerMode,
    writeComposerMode,
} from "../services/agentClient";
import {
    readRootPath,
    readRecentFolders,
    writeRootPath,
} from "../services/storage";

class ComposerModeState {
    constructor(private mode: ComposerMode = readComposerMode() ?? "auto") {}

    public getMode(): ComposerMode {
        return this.mode;
    }

    public setMode(mode: ComposerMode): void {
        if (this.mode === mode) {
            return;
        }

        this.mode = mode;
        writeComposerMode(mode);
    }
}

export class ChatPanelViewProvider {
    private panel: vscode.WebviewPanel | undefined;
    private readonly router: CommandRouter;
    private readonly modeState = new ComposerModeState();

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

        this.panel.webview.html = getChatPanelHtml();

        this.panel.webview.onDidReceiveMessage(async (message: { type: string; [key: string]: any }) => {
            if (message.type === "command") {
                const mode = isComposerMode(message.mode) ? message.mode : this.modeState.getMode();
                await this.router.route({
                    text: message.text ?? "",
                    mode,
                    extraContext: message.extraContext,
                });
            } else if (message.type === "setMode" && isComposerMode(message.mode)) {
                this.modeState.setMode(message.mode);
                this.postModeState();
            } else if (message.type === "indexAction") {
                await this.router.handleIndexAction(message.action);
            } else if (message.type === "contextRequest") {
                this.handleContextRequest(message.action);
            } else if (message.type === "localSelect" && typeof message.folder === "string") {
                await writeRootPath(this.extensionContext, message.folder);
                this.postLocalState();
            } else if (message.type === "localPick") {
                const folder = await vscode.window.showOpenDialog({
                    canSelectMany: false,
                    canSelectFolders: true,
                    canSelectFiles: false,
                    openLabel: "Select Folder",
                });

                if (folder && folder.length > 0) {
                    await writeRootPath(this.extensionContext, folder[0].fsPath);
                    this.postLocalState();
                }
            }
        });

        this.postModeState();
        this.postLocalState();
    }

    private postMessage(message: CommandResultMessage): void {
        if (!this.panel) {
            return;
        }

        this.panel.webview.postMessage(message);
    }

    private postModeState(): void {
        if (!this.panel) {
            return;
        }

        this.panel.webview.postMessage({
            type: "modeState",
            mode: this.modeState.getMode(),
        });
    }

    private postLocalState(): void {
        if (!this.panel) {
            return;
        }

        this.panel.webview.postMessage({
            type: "localState",
            rootPath: this.getEffectiveRootPath(),
            recentFolders: readRecentFolders(this.extensionContext),
        });
    }

    private handleContextRequest(action: string): void {
        switch (action) {
            case "folder": {
                const rootPath = this.getEffectiveRootPath();
                if (!rootPath) {
                    this.postMessage({
                        type: "commandResult",
                        payload: "Workspace root not available for context.",
                    });
                    this.postContextResponse(action, undefined, "no_workspace");
                    return;
                }

                this.postContextResponse(action, { root_path: rootPath });
                return;
            }
            case "selection": {
                const editor = vscode.window.activeTextEditor;
                const selection = editor?.selection;
                const selectedText = selection ? editor.document.getText(selection).trim() : "";

                if (!selectedText) {
                    this.postMessage({
                        type: "commandResult",
                        payload: "INVALID_COMMAND: Select text in the editor and try again.",
                    });
                    this.postContextResponse(action, undefined, "no_selection");
                    return;
                }

                this.postContextResponse(action, { selection_text: selectedText });
                return;
            }
            case "file": {
                const editor = vscode.window.activeTextEditor;
                const filePath = editor?.document.uri.fsPath;

                if (!filePath) {
                    this.postContextResponse(action, undefined, "no_file");
                    return;
                }

                this.postContextResponse(action, { active_file_path: filePath });
                return;
            }
            default:
                return;
        }
    }

    private postContextResponse(action: string, context?: any, error?: string): void {
        if (!this.panel) {
            return;
        }

        this.panel.webview.postMessage({
            type: "contextResponse",
            action,
            context,
            error,
        });
    }

    private getEffectiveRootPath(): string | undefined {
        return readRootPath(this.extensionContext) ?? this.getWorkspaceRootPath();
    }

    private getWorkspaceRootPath(): string | undefined {
        const folders = vscode.workspace.workspaceFolders;
        if (folders && folders.length > 0) {
            return folders[0].uri.fsPath;
        }

        if (vscode.workspace.workspaceFile) {
            return path.dirname(vscode.workspace.workspaceFile.fsPath);
        }

        return undefined;
    }
}

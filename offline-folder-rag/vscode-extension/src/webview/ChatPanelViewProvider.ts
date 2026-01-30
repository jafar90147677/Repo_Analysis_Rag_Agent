// @ts-nocheck
import * as path from "path";
import * as vscode from "vscode";

import { CommandRouter, CommandResultMessage } from "../commands/commandRouter";
import { getChatPanelHtml } from "./ui/chatPanelHtml";
import { readRootPath, writeRootPath, readRecentFolders } from "../services/storage";
import { isPathInsideRoot } from "../services/indexGate";
import {
    askWithOverride,
    ComposerMode,
    isComposerMode,
    readComposerMode,
    writeComposerMode,
} from "../services/agentClient";

const COMPOSER_PLACEHOLDER = "Plan · @ for context · / for commands";

class ModeState {
    private readonly defaultMode: ComposerMode = "auto";
    private mode: ComposerMode;

    constructor() {
        this.mode = readComposerMode() ?? this.defaultMode;
    }

    public getMode(): ComposerMode {
        return this.mode;
    }

    public setMode(newMode: ComposerMode): void {
        if (this.mode === newMode) {
            return;
        }

        this.mode = newMode;
        writeComposerMode(newMode);
    }
}

export class ChatPanelViewProvider {
    private panel?: vscode.WebviewPanel;
    private readonly router: CommandRouter;
    private readonly modeState = new ModeState();

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

        this.panel.webview.onDidReceiveMessage(async (message: { type: string; [key: string]: any }) => {
            if (message.type === "dispatch") {
                const text = String(message.text ?? "").trim();
                const modeValue = message.mode;
                const normalizedMode = isComposerMode(modeValue) ? modeValue : this.modeState.getMode();
                await this.handleDispatch(text, normalizedMode, message.extraContext);
            } else if (message.type === "modeChange" && isComposerMode(message.mode)) {
                this.modeState.setMode(message.mode);
                this.postModeState(message.mode);
            } else if (message.type === "contextRequest" && typeof message.action === "string") {
                this.handleContextRequest(message.action);
            } else if (message.type === "attachmentPick") {
                await this.handleAttachmentRequest();
            } else if (message.type === "indexAction") {
                await this.router.handleIndexAction(message.action);
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

        this.panel.webview.html = getChatPanelHtml(this.extensionUri, COMPOSER_PLACEHOLDER);

        this.postModeState(this.modeState.getMode());
        this.postLocalState();
    }

    private async handleDispatch(
        text: string,
        mode: ComposerMode,
        extraContext?: Record<string, unknown>
    ): Promise<void> {
        if (!text) {
            return;
        }

        if (mode === "rag" && !text.startsWith("/")) {
            try {
                const response = await askWithOverride(text, "rag");
                const payload = await response.json();
                this.postMessage({
                    type: "commandResult",
                    payload: payload.answer || JSON.stringify(payload),
                });
            } catch (error) {
                this.postMessage({
                    type: "commandResult",
                    payload: `Error: ${error instanceof Error ? error.message : String(error)}`,
                });
            }
            return;
        }

        if (mode === "tools") {
            if (!text.startsWith("/")) {
                this.postMessage({ type: "commandResult", payload: "INVALID_COMMAND" });
                return;
            }
            await this.router.handleCommand(text, extraContext);
            return;
        }

        if (text.startsWith("/")) {
            await this.router.handleCommand(text, extraContext);
            return;
        }

        await this.router.autoRouteInput(text, extraContext);
    }

    private async handleAttachmentRequest(): Promise<void> {
        if (!this.panel) {
            return;
        }

        const rootPath = this.getEffectiveRootPath() ?? this.getWorkspaceRootPath();
        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            canSelectFiles: true,
            openLabel: "Insert reference",
        };

        if (rootPath) {
            options.defaultUri = vscode.Uri.file(rootPath);
        }

        const selection = await vscode.window.showOpenDialog(options);
        if (!selection || selection.length === 0) {
            return;
        }

        const filePath = selection[0].fsPath;
        if (rootPath && !isPathInsideRoot(rootPath, filePath)) {
            vscode.window.showErrorMessage("Select a file inside the chosen folder.");
            return;
        }

        this.postMessage({
            type: "insertText",
            text: `@file:${filePath}`,
        });
    }

    private handleContextRequest(action: string): void {
        if (!this.panel) {
            return;
        }

        switch (action) {
            case "folder": {
                const rootPath = this.getEffectiveRootPath();
                if (!rootPath) {
                    this.postMessage({ type: "commandResult", payload: "Workspace root not available for context." });
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

    private postMessage(message: CommandResultMessage): void {
        if (!this.panel) {
            return;
        }

        this.panel.webview.postMessage(message);
    }

    private postModeState(mode: ComposerMode): void {
        if (!this.panel) {
            return;
        }

        this.panel.webview.postMessage({
            type: "modeState",
            mode,
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
}

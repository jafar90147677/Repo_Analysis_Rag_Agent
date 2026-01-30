// @ts-nocheck
import * as path from "path";
import * as vscode from "vscode";

import { parseSlashCommand, CommandResultMessage, CommandRouter } from "../commands/commandRouter";
import { getChatPanelHtml } from "./ui/chatPanelHtml";
import { triggerFullIndex, setIndexing, clearIndexing } from "../services/indexGate";
import { renderAssistantResponse } from "./components/AssistantResponseRenderer";
import {
    askWithOverride,
    startHealthPolling,
    stopHealthPolling,
    HealthResponse,
    isComposerMode,
    readComposerMode,
    writeComposerMode,
    ComposerMode
} from "../services/agentClient";
import { readRecentFolders, readRootPath, writeRootPath } from "../services/storage";

const COMPOSER_PLACEHOLDER = "Plan, @ for context, / for commands";

class ModeState {
    private mode: ComposerMode;

    constructor() {
        this.mode = readComposerMode() ?? "auto";
    }

    public getMode(): ComposerMode {
        return this.mode;
    }

    public setMode(mode: ComposerMode): void {
        this.mode = mode;
        writeComposerMode(mode);
    }
}

export class ChatPanelViewProvider {
    private panel: vscode.WebviewPanel | undefined;
    private readonly router: CommandRouter;
    private readonly modeState: ModeState;
    private readonly agentBaseUrl = "http://localhost:8000"; // Default agent URL

    constructor(
        private readonly extensionContext: vscode.ExtensionContext,
        private readonly extensionUri: vscode.Uri
    ) {
        this.router = new CommandRouter(extensionContext, (message) => this.postMessage(message));
        this.modeState = new ModeState();
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
                enableCommandUris: true,
            }
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
            stopHealthPolling();
        });

        this.panel.webview.onDidReceiveMessage(async (message) => {
            if (message.type === "command") {
                const { text, mode } = message;
                if (text.startsWith("/")) {
                    const result = await parseSlashCommand(text, this.extensionContext);
                    if (result.type === 'assistantResponse') {
                        const html = renderAssistantResponse(result.payload);
                        this.postMessage({ type: 'commandResult', payload: html, isHtml: true });
                    } else {
                        this.postMessage(result);
                    }
                } else {
                    if (mode === "RAG") {
                        try {
                            const response = await askWithOverride(text, "rag");
                            const result = await response.json();
                            let payload = result.answer || JSON.stringify(result);
                            
                            if (result.citations && Array.isArray(result.citations)) {
                                const citationsHtml = result.citations.map((c: any) => this.renderCitation(c)).join('<br>');
                                payload = `${payload}<br><br><b>Citations:</b><br>${citationsHtml}`;
                            }

                            this.postMessage({
                                type: "commandResult",
                                payload: payload,
                                isHtml: true
                            });
                        } catch (error) {
                            this.postMessage({
                                type: "commandResult",
                                payload: `Error: ${error instanceof Error ? error.message : String(error)}`,
                            });
                        }
                    } else if (mode === "Auto") {
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
            } else if (message.type === "setMode" && isComposerMode(message.mode)) {
                this.modeState.setMode(message.mode);
                this.postModeState();
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

        this.panel.webview.html = getChatPanelHtml(
            this.extensionUri,
            COMPOSER_PLACEHOLDER
        );

        this.postModeState();
        this.postLocalState();
    }

    private startPolling(): void {
        startHealthPolling(
            this.agentBaseUrl,
            (health: HealthResponse) => {
                let progressText = "";
                if (health.indexing) {
                    if (health.indexed_files_so_far > 0) {
                        progressText = `Indexing: ${health.indexed_files_so_far} files processed`;
                    } else {
                        progressText = "Scanning...";
                    }
                    this.postMessage({
                        type: "commandResult",
                        payload: progressText,
                    });
                }
            },
            (error) => {
                this.postMessage({
                    type: "commandResult",
                    payload: `Polling error: ${error.message}`,
                });
            }
        );
    }

    private renderCitation(citation: {path: string, start_line: number, end_line: number}) {
        const commandUri = vscode.Uri.parse(
            `command:citation.open?${encodeURIComponent(JSON.stringify({
                path: citation.path,
                startLine: citation.start_line,
                endLine: citation.end_line
            }))}`
        );
        
        return `<a href="${commandUri}">${citation.path} : ${citation.start_line}–${citation.end_line}</a>`;
    }

    private postMessage(message: CommandResultMessage | any): void {
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

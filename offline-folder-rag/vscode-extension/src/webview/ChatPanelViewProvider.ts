// @ts-nocheck
import * as path from "path";
import * as vscode from "vscode";

import { parseSlashCommand, CommandResultMessage, CommandRouter } from "../commands/commandRouter";
import { getChatPanelHtml } from "./ui/chatPanelHtml";
import { getConfluenceFileSelectorHtml } from "./ui/confluenceHtml";
import { triggerFullIndex, setIndexing, clearIndexing, isPathInsideRoot } from "../services/indexGate";
// import { renderAssistantResponse } from "./components/AssistantResponseRenderer";
const renderAssistantResponse = (payload: any) => JSON.stringify(payload);
import {
    askWithOverride,
    startHealthPolling,
    stopHealthPolling,
    HealthResponse,
    isComposerMode,
    readComposerMode,
    writeComposerMode,
    ComposerMode,
    DEFAULT_AGENT_BASE_URL,
    getIndexReport
} from "../services/agentClient";
import { readRecentFolders, readRootPath, writeRootPath, readAutoIndex, writeAutoIndex } from "../services/storage";
import { AutoIndexScheduler } from "../services/autoIndexScheduler";

const COMPOSER_PLACEHOLDER = "Plan · @ for context · / for commands";

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
    private readonly agentBaseUrl = DEFAULT_AGENT_BASE_URL; // Default agent URL
    private readonly scheduler: AutoIndexScheduler;

    constructor(
        private readonly extensionContext: vscode.ExtensionContext,
        private readonly extensionUri: vscode.Uri
    ) {
        this.router = new CommandRouter(extensionContext, (message) => this.postMessage(message));
        this.modeState = new ModeState();
        this.scheduler = new AutoIndexScheduler({
            triggerIndex: () => this.handleIndexAndReport('incremental'),
            getRootPath: () => this.getEffectiveRootPath(),
            agentBaseUrl: this.agentBaseUrl
        });
        
        // Listen for file saves to trigger auto-indexing
        vscode.workspace.onDidSaveTextDocument((doc) => {
            const rootPath = this.getEffectiveRootPath();
            if (rootPath && isPathInsideRoot(rootPath, doc.uri.fsPath)) {
                if (readAutoIndex(this.extensionContext)) {
                    this.scheduler.requestIndex();
                }
            }
        });
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
            await this.handleWebviewMessage(message);
            if (message.type === "dispatch") {
                const { text, mode } = message;
                const normalizedMode = isComposerMode(mode) ? mode : this.modeState.getMode();
                
                if (text.startsWith("/")) {
                    const result = await parseSlashCommand(text, this.extensionContext);
                    if (result.type === 'assistantResponse') {
                        const html = renderAssistantResponse(result.payload);
                        this.postMessage({ type: 'commandResult', payload: html, isHtml: true });
                    } else if (result.type === 'commandResult' && result.payload === 'Indexing started: full scan') {
                        this.postMessage(result);
                        this.handleIndexAndReport('full');
                    } else if (result.type === 'commandResult' && result.payload === 'Indexing started: incremental scan') {
                        this.postMessage(result);
                        this.handleIndexAndReport('incremental');
                    } else if (result.type === 'commandResult' && result.payload === 'Auto-index disabled.') {
                        this.scheduler.stop();
                        this.postMessage(result);
                    } else {
                        this.postMessage(result);
                    }
                } else {
                    const extraContext = this.buildExtraContext();
                    if (normalizedMode === "rag") {
                        try {
                            const response = await askWithOverride(text, "rag", extraContext);
                            const result = await response.json();
                            
                            if (result.error === "INVALID_TOKEN") {
                                this.postMessage({ type: "commandResult", payload: "Error: INVALID_TOKEN. Please check your agent token." });
                                return;
                            }

                            let payload = result.answer || JSON.stringify(result);
                            
                            const assistantResponseHtml = renderAssistantResponse({
                                mode: "rag",
                                confidence: result.confidence || "found",
                                answer: payload,
                                citations: result.citations || []
                            });

                            this.postMessage({
                                type: "commandResult",
                                payload: assistantResponseHtml,
                                isHtml: true
                            });
                        } catch (error) {
                            this.postMessage({
                                type: "commandResult",
                                payload: `Error: ${error instanceof Error ? error.message : String(error)}`,
                            });
                        }
                    } else if (normalizedMode === "auto") {
                        try {
                            await this.router.autoRouteInput(text, extraContext);
                        } catch (error) {
                            this.postMessage({
                                type: "commandResult",
                                payload: `Error: ${error instanceof Error ? error.message : String(error)}`,
                            });
                        }
                    } else {
                        await this.router.handleCommand(text, extraContext);
                    }
                }
            } else if (message.type === "indexAction") {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders || workspaceFolders.length === 0) return;
                const rootPath = workspaceFolders[0].uri.fsPath;

                if (message.action === "full") {
                    this.postMessage({ type: "dismissIndexModal" });
                    this.handleIndexAndReport('full');
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
            } else if (message.type === "modeChange" && isComposerMode(message.mode)) {
                this.modeState.setMode(message.mode);
                this.postModeState();
            } else if (message.type === "confluenceSave") {
                const html = getConfluenceFileSelectorHtml([], this.getNonce());
                this.postMessage({ type: 'commandResult', payload: html, isHtml: true, isConfluence: true });
            } else if (message.type === "contextRequest") {
                this.handleContextRequest(message.action);
            } else if (message.type === "attachmentPick") {
                await this.handleAttachmentRequest();
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
            } else if (message.type === "confluenceBrowse") {
                const files = await vscode.window.showOpenDialog({
                    canSelectMany: true,
                    canSelectFolders: false,
                    canSelectFiles: true,
                    filters: {
                        'Code and Text': ['txt', 'py', 'js', 'ts', 'tsx', 'json', 'md', 'html', 'css', 'yml', 'yaml']
                    },
                    openLabel: "Select Files for Confluence",
                });
                if (files && files.length > 0) {
                    const fileNames = files.map(f => path.basename(f.fsPath));
                    const html = getConfluenceFileSelectorHtml(fileNames, this.getNonce());
                    this.postMessage({ type: 'commandResult', payload: html, isHtml: true, isConfluence: true });
                }
            } else if (message.type === "confluenceNext") {
                const { getConfluenceAnalysisHtml } = require("./ui/confluenceHtml");
                const html = getConfluenceAnalysisHtml(message.files || [], this.getNonce());
                this.postMessage({ type: 'commandResult', payload: html, isHtml: true, isConfluence: true });
            } else if (message.type === "confluenceCreate") {
                const { getConfluenceProgressHtml, getConfluenceErrorHtml, getConfluenceSuccessHtml } = require("./ui/confluenceHtml");
                const progressHtml = getConfluenceProgressHtml();
                this.postMessage({ type: 'commandResult', payload: progressHtml, isHtml: true, isConfluence: true });
                
                // Simulate creation delay
                setTimeout(() => {
                    // Randomly show error or success for testing
                    const isError = Math.random() > 0.8;
                    if (isError) {
                        const errorHtml = getConfluenceErrorHtml(
                            "intelligence_error",
                            "AI could not determine optimal format",
                            "Try providing more context or different files",
                            0.45,
                            this.getNonce()
                        );
                        this.postMessage({ type: 'commandResult', payload: errorHtml, isHtml: true, isConfluence: true });
                    } else {
                        const successHtml = getConfluenceSuccessHtml(this.getNonce());
                        this.postMessage({ type: 'commandResult', payload: successHtml, isHtml: true, isConfluence: true });
                    }
                }, 3000);
            } else if (message.type === "openUrl" && message.url) {
                vscode.env.openExternal(vscode.Uri.parse(message.url));
            } else if (message.type === "copyToClipboard" && message.text) {
                vscode.env.clipboard.writeText(message.text);
                vscode.window.showInformationMessage('Link copied to clipboard!');
            } else if (message.type === "confluenceSettings") {
                vscode.commands.executeCommand('workbench.action.openSettings', 'confluence');
            }
        });

        this.panel.webview.html = getChatPanelHtml(this.extensionUri, COMPOSER_PLACEHOLDER);

        this.postModeState();
        this.postLocalState();
    }

    private async handleWebviewMessage(message: any): Promise<void> {
        if (message.type === "dispatch") {
            const { text, mode } = message;
            const normalizedMode = isComposerMode(mode) ? mode : this.modeState.getMode();
            
            if (text.startsWith("/")) {
                const result = await parseSlashCommand(text, this.extensionContext);
                if (result.type === 'assistantResponse') {
                    const html = renderAssistantResponse(result.payload);
                    this.postMessage({ type: 'commandResult', payload: html, isHtml: true });
                } else {
                    this.postMessage(result);
                }
            } else {
                const extraContext = this.buildExtraContext();
                if (normalizedMode === "rag") {
                    try {
                        const response = await askWithOverride(text, "rag", extraContext);
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
                } else if (normalizedMode === "auto") {
                    try {
                        await this.router.autoRouteInput(text, extraContext);
                    } catch (error) {
                        this.postMessage({
                            type: "commandResult",
                            payload: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        });
                    }
                } else {
                    await this.router.handleCommand(text, extraContext);
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
        } else if (message.type === "modeChange" && isComposerMode(message.mode)) {
            this.modeState.setMode(message.mode);
            this.postModeState();
        } else if (message.type === "contextRequest") {
            this.handleContextRequest(message.action);
        } else if (message.type === "attachmentPick") {
            await this.handleAttachmentRequest();
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
            } else {
                // Cancellation: post current state to ensure UI reflects unchanged rootPath
                this.postLocalState();
            }
        }
    }

    private async handleIndexAndReport(mode: 'full' | 'incremental') {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) return;
        const rootPath = workspaceFolders[0].uri.fsPath;

        setIndexing(rootPath);
        try {
            await triggerFullIndex(
                { storageRoot: this.extensionContext.globalStorageUri.fsPath },
                rootPath,
                (msg) => this.postMessage({ type: "commandResult", payload: msg })
            );
            
            const report = await getIndexReport(this.agentBaseUrl, rootPath);
            const reportHtml = this.renderIndexReport(report);
            this.postMessage({
                type: "commandResult",
                payload: reportHtml,
                isHtml: true
            });
        } catch (error) {
            this.postMessage({
                type: "commandResult",
                payload: `Indexing failed: ${error instanceof Error ? error.message : String(error)}`
            });
        } finally {
            clearIndexing(rootPath);
        }
    }

    private renderIndexReport(report: any): string {
        const indexedCount = report.indexed_files?.length || 0;
        const skippedCount = report.skipped_files?.length || 0;
        const topReasons = report.top_skip_reasons?.slice(0, 3)
            .map((r: any) => `${r.reason} (${r.count})`)
            .join(', ') || 'None';

        return `
            <div class="index-report">
                <h3>Index Summary</h3>
                <p><b>Indexed:</b> ${indexedCount} files</p>
                <p><b>Skipped:</b> ${skippedCount} files</p>
                <p><b>Top Skip Reasons:</b> ${topReasons}</p>
            </div>
        `;
    }

    private async handleAttachmentRequest(): Promise<void> {
        if (!this.panel) return;
        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            canSelectFiles: true,
            openLabel: "Insert reference",
        };
        const rootPath = this.getEffectiveRootPath();
        if (rootPath) options.defaultUri = vscode.Uri.file(rootPath);

        const selection = await vscode.window.showOpenDialog(options);
        if (selection && selection.length > 0) {
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

    private handleContextRequest(action: string): void {
        if (!this.panel) return;
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
                    this.postMessage({ type: "commandResult", payload: "INVALID_COMMAND: Select text in the editor and try again." });
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
        if (!this.panel) return;
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
        if (folders && folders.length > 0) return folders[0].uri.fsPath;
        if (vscode.workspace.workspaceFile) return path.dirname(vscode.workspace.workspaceFile.fsPath);
        return undefined;
    }

    private postMessage(message: any): void {
        if (!this.panel) return;
        this.panel.webview.postMessage(message);
    }

    private postModeState(): void {
        if (!this.panel) return;
        this.panel.webview.postMessage({
            type: "modeState",
            mode: this.modeState.getMode(),
        });
    }

    private postLocalState(): void {
        if (!this.panel) return;
        this.panel.webview.postMessage({
            type: "localState",
            rootPath: this.getEffectiveRootPath(),
            recentFolders: readRecentFolders(this.extensionContext),
        });
    }

    private getNonce(): string {
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let text = "";
        for (let i = 0; i < 16; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    private buildExtraContext(): { root_path: string } | undefined {
        const rootPath = this.getEffectiveRootPath();
        if (!rootPath) {
            return undefined;
        }
        return { root_path: rootPath };
    }
}

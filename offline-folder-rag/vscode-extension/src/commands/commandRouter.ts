import * as path from "path";
import * as vscode from "vscode";

import {
    checkIndexExists,
    clearIndexing,
    IndexGateConfig,
    setIndexing,
    triggerFullIndex,
    isIndexing,
} from "../services/indexGate";
import { normalizeRootPath } from "../utils/pathNormalize";
import { parseSlashCommand, SlashCommandInstruction } from "./slashCommands";
import { ComposerMode, isComposerMode } from "../services/agentClient";
import { readAutoIndex, readRootPath, writeAutoIndex } from "../services/storage";

export type CommandResultMessage = {
    type: "showIndexModal" | "dismissIndexModal" | "commandResult";
    payload?: string;
};

type ExtraContext = {
    root_path?: string;
    selection_text?: string;
    active_file_paths?: string[];
};

type CommandRequest = {
    text: string;
    mode: ComposerMode;
    extraContext?: ExtraContext;
};

export class CommandRouter {
    private config: IndexGateConfig;
    private toolsMode = false;
    private static readonly AUTO_INDEX_KEY = "offlineFolderRag.autoIndexEnabled";

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly sendMessage: (message: CommandResultMessage) => void
    ) {
        const storageRoot =
            context.globalStorageUri?.fsPath ?? path.join(context.extensionUri.fsPath, ".offline-folder-rag");
        this.config = { storageRoot };
    }

    public async route(request: CommandRequest): Promise<void> {
        const trimmed = request.text.trim();
        if (!trimmed) {
            return;
        }

        if (trimmed === "/tools") {
            this.toolsMode = !this.toolsMode;
            this.postResult(`Tools mode ${this.toolsMode ? "enabled" : "disabled"}`);
            return;
        }

        const mode = this.normalizeMode(request.mode);
        const isSlash = trimmed.startsWith("/");

        if (!isSlash) {
            if (mode === "tools") {
                this.postResult("INVALID_COMMAND");
                return;
            }

            if (mode === "rag") {
                const askCommand: SlashCommandInstruction = {
                    kind: "ask",
                    question: trimmed,
                    modeOverride: "rag",
                };

                if (!(await this.ensureIndexForCommand(askCommand))) {
                    return;
                }

                await this.handleSlashCommand(askCommand, request.extraContext);
                return;
            }

            const contextSummary = this.formatContextSummary(request.extraContext);
            this.postResult(
                `Executing ${trimmed}${this.toolsMode ? " (tools mode)" : ""}${contextSummary}`
            );
            return;
        }

        const parsed = parseSlashCommand(trimmed);
        if (!parsed.success) {
            this.postResult("INVALID_COMMAND");
            return;
        }

        if (!(await this.ensureIndexForCommand(parsed.command))) {
            return;
        }

        await this.handleSlashCommand(parsed.command, request.extraContext);
    }

    public async handleIndexAction(action: "full" | "cancel"): Promise<void> {
        const rootPath = this.getEffectiveRootPath();
        const normalizedRoot = rootPath ? normalizeRootPath(rootPath) : "";

        if (!rootPath) {
            this.postResult("Workspace root not available for indexing.");
            return;
        }

        if (action === "cancel") {
            this.postResult("Index not available; cannot answer.");
            this.postMessage({ type: "dismissIndexModal" });
            return;
        }

        if (isIndexing(normalizedRoot)) {
            this.postResult("Indexing already in progress.");
            return;
        }

        setIndexing(normalizedRoot);
        this.postResult("Running /index full ...");

        try {
            await triggerFullIndex(this.config, rootPath, (message) => {
                this.postResult(message);
            });
            this.postResult("Full index completed.");
        } catch (error) {
            this.postResult(`Indexing failed: ${String(error)}`);
        } finally {
            clearIndexing(normalizedRoot);
            this.postMessage({ type: "dismissIndexModal" });
        }
    }

    private normalizeMode(mode: unknown): ComposerMode {
        return isComposerMode(mode) ? mode : "auto";
    }

    private async ensureIndexForCommand(command: SlashCommandInstruction): Promise<boolean> {
        if (!this.commandRequiresIndex(command)) {
            return true;
        }

        const rootPath = this.getEffectiveRootPath();
        if (!rootPath) {
            this.postResult("Workspace root not found; command cannot run.");
            return false;
        }

        const normalizedRoot = normalizeRootPath(rootPath);
        if (isIndexing(normalizedRoot)) {
            this.postResult("Indexing already in progress.");
            return false;
        }

        if (!(await checkIndexExists(this.config, rootPath))) {
            this.postMessage({ type: "showIndexModal" });
            return false;
        }

        return true;
    }

    private commandRequiresIndex(command: SlashCommandInstruction): boolean {
        switch (command.kind) {
            case "ask":
            case "overview":
            case "search":
                return true;
            case "index":
                return command.mode === "report";
            default:
                return false;
        }
    }

    private async handleSlashCommand(command: SlashCommandInstruction, extraContext?: ExtraContext): Promise<void> {
        const contextSummary = this.formatContextSummary(extraContext);

        switch (command.kind) {
            case "index":
                if (command.mode === "full") {
                    await this.handleIndexAction("full");
                    return;
                }

                if (command.mode === "incremental") {
                    this.postResult(`Incremental index requested.${contextSummary}`);
                    return;
                }

                this.postResult(`Index report requested.${contextSummary}`);
                return;
            case "overview":
                this.postResult(`Overview requested.${contextSummary}`);
                return;
            case "search":
                this.postResult(`Searching for "${command.query}".${contextSummary}`);
                return;
            case "doctor":
                this.postResult(`Doctor command requested.${contextSummary}`);
                return;
            case "autoindex":
                await this.setAutoIndex(command.enabled);
                this.postResult(
                    `Auto-index ${this.isAutoIndexEnabled() ? "enabled" : "disabled"}.${contextSummary}`
                );
                return;
            case "ask": {
                const overrideNote = command.modeOverride ? ` mode_override="${command.modeOverride}"` : "";
                this.postResult(`Asking${overrideNote}: "${command.question}".${contextSummary}`);
                return;
            }
        }
    }
    
    private formatContextSummary(extraContext?: ExtraContext): string {
        if (!extraContext) {
            return "";
        }

        const parts: string[] = [];

        if (extraContext.root_path) {
            parts.push(`root_path=${extraContext.root_path}`);
        }

        if (extraContext.selection_text) {
            parts.push(`selection_text="${extraContext.selection_text}"`);
        }

        if (extraContext.active_file_paths?.length) {
            parts.push(`active_file_paths=[${extraContext.active_file_paths.join(", ")}]`);
        }

        return parts.length ? ` [context: ${parts.join("; ")}]` : "";
    }

    private async setAutoIndex(enabled: boolean): Promise<void> {
        await writeAutoIndex(this.context, enabled);
    }

    private isAutoIndexEnabled(): boolean {
        return readAutoIndex(this.context);
    }

    private getEffectiveRootPath(): string | undefined {
        return readRootPath(this.context) ?? this.getWorkspaceRootPath();
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

    private postResult(payload: string): void {
        this.postMessage({ type: "commandResult", payload });
    }

    private postMessage(message: CommandResultMessage): void {
        this.sendMessage(message);
    }
}

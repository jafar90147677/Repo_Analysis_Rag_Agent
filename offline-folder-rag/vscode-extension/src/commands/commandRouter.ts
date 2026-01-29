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

export type CommandResultMessage = {
    type: "showIndexModal" | "dismissIndexModal" | "commandResult";
    payload?: string;
};

const gatedCommands = new Set(["/ask", "/overview", "/search", "/index report"]);

export class CommandRouter {
    private config: IndexGateConfig;
    private toolsMode = false;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly sendMessage: (message: CommandResultMessage) => void
    ) {
        const storageRoot =
            context.globalStorageUri?.fsPath ?? path.join(context.extensionUri.fsPath, ".offline-folder-rag");
        this.config = { storageRoot };
    }

    public async route(commandText: string): Promise<void> {
        const trimmed = commandText.trim();
        if (!trimmed) {
            return;
        }

        if (trimmed === "/tools") {
            this.toolsMode = !this.toolsMode;
            this.postResult(`Tools mode ${this.toolsMode ? "enabled" : "disabled"}`);
            return;
        }

        const rootPath = this.getWorkspaceRootPath();
        const normalizedRoot = rootPath ? normalizeRootPath(rootPath) : "";

        if (!rootPath) {
            this.postResult("Workspace root not found; command cannot run.");
            return;
        }

        if (gatedCommands.has(trimmed)) {
            if (isIndexing(normalizedRoot)) {
                this.postResult("Indexing already in progress.");
                return;
            }

            if (!(await checkIndexExists(this.config, rootPath))) {
                this.postMessage({ type: "showIndexModal" });
                return;
            }
        }

        this.postResult(`Executing ${trimmed}${this.toolsMode ? " (tools mode)" : ""}.`);
    }

    public async handleIndexAction(action: "full" | "cancel"): Promise<void> {
        const rootPath = this.getWorkspaceRootPath();
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

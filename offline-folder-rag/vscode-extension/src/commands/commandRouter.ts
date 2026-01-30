import * as vscode from "vscode";
import { overview, search, ask, askWithOverride } from '../services/agentClient';
import { parseSlashCommandInstruction, SlashCommandInstruction } from "./slashCommands";

export interface CommandResultMessage {
    type: "commandResult" | "showIndexModal" | "dismissIndexModal";
    payload?: string;
    isHtml?: boolean;
}

function describeCommand(command: SlashCommandInstruction): string {
    switch (command.kind) {
        case "index":
            return `Indexing started: ${command.mode} scan`;
        case "overview":
            return "Overview: Folder structure and key files...";
        case "search":
            return `Searching for ${command.query}`;
        case "doctor":
            return "Running system checks...";
        case "autoindex":
            return command.enabled ? "Auto-indexing enabled" : "Auto-indexing disabled";
        case "ask":
            return `Asking the system: ${command.question}`;
        default:
            return "INVALID_COMMAND";
    }
}

export async function parseSlashCommand(
    input: string,
    _context: vscode.ExtensionContext
): Promise<CommandResultMessage> {
    const parsed = parseSlashCommandInstruction(input);
    if (!parsed.success) {
        return { type: "commandResult", payload: "INVALID_COMMAND" };
    }

    return { type: "commandResult", payload: describeCommand(parsed.command) };
}

export class CommandRouter {
    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly onResult: (message: CommandResultMessage) => void
    ) {}

    private postResult(payload: string, isHtml: boolean = false) {
        this.onResult({ type: "commandResult", payload, isHtml });
    }

    public async handleCommand(input: string, _extraContext?: any): Promise<void> {
        const trimmed = input.trim();
        if (!trimmed.startsWith("/")) {
            this.postResult("INVALID_COMMAND");
            return;
        }

        const parsed = parseSlashCommandInstruction(trimmed);
        if (!parsed.success) {
            this.postResult("INVALID_COMMAND");
            return;
        }

        this.postResult(describeCommand(parsed.command));
    }

    public async autoRouteInput(input: string, extraContext?: any): Promise<void> {
        const trimmed = input.trim();
        const overviewKeywords = ['overview', 'structure', 'languages'];
        const searchKeywords = ['search', 'find', 'where', 'locate'];

        let response: Response;
        if (overviewKeywords.some(k => trimmed.toLowerCase().includes(k))) {
            response = await overview(trimmed, extraContext);
        } else if (searchKeywords.some(k => trimmed.toLowerCase().includes(k))) {
            response = await search(trimmed, extraContext);
        } else {
            response = await ask(trimmed, extraContext);
        }

        const result = await response.json() as any;
        this.onResult({
            type: "commandResult",
            payload: result.answer || JSON.stringify(result)
        });
    }

    public async handleIndexAction(action: string): Promise<void> {
        if (action === "full" || action === "cancel") {
            this.postResult(`Index action: ${action}`);
        }
    }

    public async route(options: { text: string; mode: string; extraContext?: any }): Promise<void> {
        const { text, mode, extraContext } = options;
        if (mode === "RAG" && !text.startsWith("/")) {
            try {
                const response = await askWithOverride(text, "rag", extraContext);
                const result = await response.json();
                this.onResult({
                    type: "commandResult",
                    payload: result.answer || JSON.stringify(result),
                });
            } catch (error) {
                this.onResult({
                    type: "commandResult",
                    payload: `Error: ${error instanceof Error ? error.message : String(error)}`,
                });
            }
        } else if (mode === "Auto" && !text.startsWith("/")) {
            await this.autoRouteInput(text, extraContext);
        } else {
            await this.handleCommand(text, extraContext);
        }
    }
}

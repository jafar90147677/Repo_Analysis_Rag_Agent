import * as vscode from "vscode";
import { parseSlashCommandInstruction, SlashCommandInstruction } from "./slashCommands";

export interface CommandResultMessage {
    type: "commandResult" | "showIndexModal" | "dismissIndexModal";
    payload?: string;
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
        _context: vscode.ExtensionContext,
        private readonly onResult: (message: CommandResultMessage) => void
    ) {}

    private postResult(payload: string) {
        this.onResult({ type: "commandResult", payload });
    }

    public async handleCommand(input: string, _extraContext?: Record<string, unknown>): Promise<void> {
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

    public async autoRouteInput(input: string, _extraContext?: Record<string, unknown>): Promise<void> {
        this.postResult(`Auto route not implemented: ${input.trim()}`);
    }

    public async handleIndexAction(action: string): Promise<void> {
        this.postResult(`Index action: ${action}`);
    }

    public handleToolsSlashCommand(input: string): string {
        const parsed = parseSlashCommandInstruction(input);
        if (!parsed.success) {
            return "INVALID_COMMAND";
        }

        return describeCommand(parsed.command);
    }
}

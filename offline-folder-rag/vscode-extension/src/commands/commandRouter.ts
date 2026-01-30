import * as vscode from "vscode";
import { slashCommandRegistry } from './slashCommands';
import { overview, search, ask, askWithOverride } from '../services/agentClient';

export interface CommandResultMessage {
    type: "commandResult";
    payload: string;
}

export class CommandRouter {
    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly onResult: (message: CommandResultMessage) => void
    ) {}

    public async handleCommand(input: string, extraContext?: any): Promise<void> {
        const result = this.handleToolsSlashCommand(input);
        this.onResult({
            type: "commandResult",
            payload: result
        });
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
        // ... implementation ...
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
                    payload: `Error: \${error instanceof Error ? error.message : String(error)}`,
                });
            }
        } else if (mode === "Auto" && !text.startsWith("/")) {
            await this.autoRouteInput(text, extraContext);
        } else {
            await this.handleCommand(text, extraContext);
        }
    }

    public handleToolsSlashCommand(input: string): string {
        const trimmed = input.trim();
        if (!trimmed.startsWith('/')) {
            return 'INVALID_COMMAND';
        }

        const parts = trimmed.split(' ');
        // Try two-word command first (e.g., "/index full")
        const twoWordCmd = parts[0] + (parts[1] ? ' ' + parts[1] : '');
        if (slashCommandRegistry[twoWordCmd]) {
            const args = trimmed.slice(twoWordCmd.length).trim();
            return slashCommandRegistry[twoWordCmd](args);
        }

        // Try one-word command (e.g., "/overview")
        const oneWordCmd = parts[0];
        if (slashCommandRegistry[oneWordCmd]) {
            const args = trimmed.slice(oneWordCmd.length).trim();
            return slashCommandRegistry[oneWordCmd](args);
        }

        return 'INVALID_COMMAND';
    }
}

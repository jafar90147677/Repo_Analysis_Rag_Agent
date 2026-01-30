import * as vscode from "vscode";
import { slashCommandRegistry } from './slashCommands';
import { overview, search, ask } from '../services/agentClient';

export interface CommandResultMessage {
    type: "commandResult";
    payload: string;
}

export class CommandRouter {
    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly onResult: (message: CommandResultMessage) => void
    ) {}

    public async handleCommand(input: string): Promise<void> {
        const result = this.handleToolsSlashCommand(input);
        this.onResult({
            type: "commandResult",
            payload: result
        });
    }

    public async autoRouteInput(input: string): Promise<void> {
        const trimmed = input.trim();
        const overviewKeywords = ['overview', 'structure', 'languages'];
        const searchKeywords = ['search', 'find', 'where', 'locate'];

        let response: Response;
        if (overviewKeywords.some(k => trimmed.toLowerCase().includes(k))) {
            response = await overview(trimmed);
        } else if (searchKeywords.some(k => trimmed.toLowerCase().includes(k))) {
            response = await search(trimmed);
        } else {
            response = await ask(trimmed);
        }

        const result = await response.json() as any;
        this.onResult({
            type: "commandResult",
            payload: result.answer || JSON.stringify(result)
        });
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

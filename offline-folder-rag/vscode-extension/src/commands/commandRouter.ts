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
import { checkIndexExists, isIndexing } from '../services/indexGate';
import * as vscode from 'vscode';

export interface CommandResultMessage {
    type: 'commandResult' | 'showIndexModal' | 'dismissIndexModal' | 'assistantResponse';
    payload?: any;
    isHtml?: boolean;
}

/**
 * Parses and executes a slash command from the user input.
 * Uses a deterministic, registry-based approach.
 * @param input The raw input string starting with /
 * @param context VSCode extension context
 * @returns The result message or modal trigger
 */
export async function parseSlashCommand(
    input: string,
    context: vscode.ExtensionContext
): Promise<CommandResultMessage> {
    const trimmedInput = input.trim();
    if (!trimmedInput.startsWith('/')) {
        return { type: 'commandResult', payload: 'INVALID_COMMAND' };
    }

    const gatedCommands = ['/ask', '/overview', '/search', '/index report'];
    const isGated = gatedCommands.some(cmd => trimmedInput === cmd || trimmedInput.startsWith(cmd + ' '));

    if (isGated) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const rootPath = workspaceFolders[0].uri.fsPath;
            const storageRoot = context.globalStorageUri.fsPath;
            
            if (isIndexing(rootPath)) {
                return { type: 'commandResult', payload: 'Indexing in progress...' };
            }

            const exists = await checkIndexExists({ storageRoot }, rootPath);
            if (!exists) {
                return { type: 'showIndexModal' };
            }
        }
    }

    // Commands that support arguments
    const commandsWithArgs = ['/search', '/ask'];

    for (const commandKey of Object.keys(slashCommandRegistry)) {
        if (commandsWithArgs.includes(commandKey)) {
            // For /search and /ask, we match the prefix and treat the rest as args
            if (trimmedInput === commandKey || trimmedInput.startsWith(commandKey + ' ')) {
                const args = trimmedInput.slice(commandKey.length).trim();
                const result = slashCommandRegistry[commandKey](args);
                
                // For /ask and /search, wrap in assistantResponse envelope for rendering
                if (commandKey === '/ask' || commandKey === '/search') {
                    return {
                        type: 'assistantResponse',
                        payload: {
                            mode: 'rag',
                            confidence: 'found',
                            answer: result,
                            citations: []
                        }
                    };
                }
                return { type: 'commandResult', payload: result };
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
            // For all other commands, we require an exact match
            if (trimmedInput === commandKey) {
                const result = slashCommandRegistry[commandKey]('');
                
                // For /overview and /index report, wrap in assistantResponse envelope
                if (commandKey === '/overview' || commandKey === '/index report' || commandKey === '/doctor') {
                    return {
                        type: 'assistantResponse',
                        payload: {
                            mode: commandKey === '/doctor' ? 'tools' : 'rag',
                            confidence: 'found',
                            answer: result,
                            citations: []
                        }
                    };
                }
                return { type: 'commandResult', payload: result };
            }
        }
    }

    return { type: 'commandResult', payload: 'INVALID_COMMAND' };
}

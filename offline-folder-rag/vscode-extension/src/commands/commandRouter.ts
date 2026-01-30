import { slashCommandRegistry } from './slashCommands';
import { checkIndexExists, isIndexing } from '../services/indexGate';
import * as vscode from 'vscode';

export interface CommandResultMessage {
    type: 'commandResult' | 'showIndexModal' | 'dismissIndexModal';
    payload?: string;
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
                return { type: 'commandResult', payload: slashCommandRegistry[commandKey](args) };
            }
        } else {
            // For all other commands, we require an exact match
            if (trimmedInput === commandKey) {
                return { type: 'commandResult', payload: slashCommandRegistry[commandKey]('') };
            }
        }
    }

    return { type: 'commandResult', payload: 'INVALID_COMMAND' };
}

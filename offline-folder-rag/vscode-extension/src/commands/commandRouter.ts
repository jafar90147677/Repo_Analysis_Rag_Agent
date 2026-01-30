import { slashCommandRegistry } from './slashCommands';

/**
 * Parses and executes a slash command from the user input.
 * Uses a deterministic, registry-based approach.
 * @param input The raw input string starting with /
 * @returns The result of the command execution or 'INVALID_COMMAND'
 */
export function parseSlashCommand(input: string): string {
    const trimmedInput = input.trim();
    if (!trimmedInput.startsWith('/')) {
        return 'INVALID_COMMAND';
    }

    // Commands that support arguments
    const commandsWithArgs = ['/search', '/ask'];

    for (const commandKey of Object.keys(slashCommandRegistry)) {
        if (commandsWithArgs.includes(commandKey)) {
            // For /search and /ask, we match the prefix and treat the rest as args
            if (trimmedInput === commandKey || trimmedInput.startsWith(commandKey + ' ')) {
                const args = trimmedInput.slice(commandKey.length).trim();
                return slashCommandRegistry[commandKey](args);
            }
        } else {
            // For all other commands, we require an exact match
            if (trimmedInput === commandKey) {
                return slashCommandRegistry[commandKey]('');
            }
        }
    }

    return 'INVALID_COMMAND';
}

export type SlashCommandInstruction =
    | { kind: "index"; mode: "full" | "incremental" | "report" }
    | { kind: "overview" }
    | { kind: "search"; query: string }
    | { kind: "doctor" }
    | { kind: "autoindex"; enabled: boolean }
    | { kind: "ask"; question: string; modeOverride?: string };

export type SlashCommandParseResult =
    | { success: true; command: SlashCommandInstruction }
    | { success: false; reason: "INVALID_COMMAND" };

export function parseSlashCommandInstruction(input: string): SlashCommandParseResult {
    const trimmed = input.trim();
    if (!trimmed.startsWith("/")) {
        return { success: false, reason: "INVALID_COMMAND" };
    }

    const payload = trimmed.slice(1).trim();
    if (!payload) {
        return { success: false, reason: "INVALID_COMMAND" };
    }

    const tokens = payload.split(/\s+/);
    const command = tokens.shift()?.toLowerCase() ?? "";

    switch (command) {
        case "index": {
            const mode = tokens.shift()?.toLowerCase();
            if (!mode) {
                return { success: false, reason: "INVALID_COMMAND" };
            }

            if (mode === "full" || mode === "incremental" || mode === "report") {
                return {
                    success: true,
                    command: { kind: "index", mode },
                };
            }

            return { success: false, reason: "INVALID_COMMAND" };
        }
        case "overview":
            return { success: true, command: { kind: "overview" } };
        case "search": {
            const query = tokens.join(" ").trim();
            if (!query) {
                return { success: false, reason: "INVALID_COMMAND" };
            }

            return {
                success: true,
                command: { kind: "search", query },
            };
        }
        case "doctor":
            return { success: true, command: { kind: "doctor" } };
        case "autoindex": {
            const option = tokens.shift()?.toLowerCase();
            if (option === "on") {
                return { success: true, command: { kind: "autoindex", enabled: true } };
            }
            if (option === "off") {
                return { success: true, command: { kind: "autoindex", enabled: false } };
            }

            return { success: false, reason: "INVALID_COMMAND" };
        }
        case "ask": {
            const question = tokens.join(" ").trim();
            if (!question) {
                return { success: false, reason: "INVALID_COMMAND" };
            }

            return { success: true, command: { kind: "ask", question } };
        }
        default:
            return { success: false, reason: "INVALID_COMMAND" };
    }
}
<<<<<<< HEAD
/**
 * Deterministic registry of supported slash commands.
 * ONLY supported commands are included here.
 */
export const slashCommandRegistry: { [key: string]: (args: string) => string } = {
    '/index full': (args) => {
        return 'Indexing started: full scan';
    },
    '/index incremental': (args) => {
        return 'Indexing started: incremental scan';
    },
    '/index report': (args) => {
        return 'Generating index report...';
    },
    '/overview': (args) => {
        return 'Overview: Folder structure and key files...';
    },
    '/search': (args) => {
        return `Searching for ${args}`;
    },
    '/doctor': (args) => {
        return 'Running system checks...';
    },
    '/autoindex on': (args) => {
        return 'Auto-indexing enabled';
    },
    '/autoindex off': (args) => {
        return 'Auto-indexing disabled';
    },
    '/ask': (args) => {
        return `Asking the system: ${args}`;
    }
};
=======

const slashCommandRegistry: { [key: string]: (args: string) => string } = {
    "/index full": () => "Indexing started: full scan",
    "/index incremental": () => "Indexing started: incremental scan",
    "/index report": () => "Generating index report...",
    "/overview": () => "Overview: Folder structure and key files...",
    "/search": (args) => `Searching for ${args}`,
    "/doctor": () => "Running system checks...",
    "/autoindex on": () => "Auto-indexing enabled",
    "/autoindex off": () => "Auto-indexing disabled",
    "/ask": (args) => `Asking the system: ${args}`,
};

export function parseSlashCommand(input: string): string {
    const trimmedInput = input.trim();
    if (!trimmedInput.startsWith("/")) {
        return "INVALID_COMMAND";
    }

    const commandsWithArgs = ["/search", "/ask"];

    for (const commandKey of Object.keys(slashCommandRegistry)) {
        if (commandsWithArgs.includes(commandKey)) {
            if (trimmedInput === commandKey || trimmedInput.startsWith(commandKey + " ")) {
                const args = trimmedInput.slice(commandKey.length).trim();
                return slashCommandRegistry[commandKey](args);
            }
        } else {
            if (trimmedInput === commandKey) {
                return slashCommandRegistry[commandKey]("");
            }
        }
    }

    return "INVALID_COMMAND";
}
>>>>>>> bdbd261 (47)

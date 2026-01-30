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

type SlashCommandHandler = {
    key: string;
    requiresArgs: boolean;
    build: (args?: string) => SlashCommandInstruction;
};

const slashCommandRegistry: SlashCommandHandler[] = [
    {
        key: "/index full",
        requiresArgs: false,
        build: () => ({ kind: "index", mode: "full" }),
    },
    {
        key: "/index incremental",
        requiresArgs: false,
        build: () => ({ kind: "index", mode: "incremental" }),
    },
    {
        key: "/index report",
        requiresArgs: false,
        build: () => ({ kind: "index", mode: "report" }),
    },
    {
        key: "/overview",
        requiresArgs: false,
        build: () => ({ kind: "overview" }),
    },
    {
        key: "/search",
        requiresArgs: true,
        build: (args = "") => ({ kind: "search", query: args }),
    },
    {
        key: "/doctor",
        requiresArgs: false,
        build: () => ({ kind: "doctor" }),
    },
    {
        key: "/autoindex on",
        requiresArgs: false,
        build: () => ({ kind: "autoindex", enabled: true }),
    },
    {
        key: "/autoindex off",
        requiresArgs: false,
        build: () => ({ kind: "autoindex", enabled: false }),
    },
    {
        key: "/ask",
        requiresArgs: true,
        build: (args = "") => ({ kind: "ask", question: args }),
    },
];


export function parseSlashCommandInstruction(input: string): SlashCommandParseResult {
    const trimmed = input.trim();
    if (!trimmed.startsWith("/")) {
        return { success: false, reason: "INVALID_COMMAND" };
    }

    for (const handler of slashCommandRegistry) {
        if (handler.requiresArgs) {
            if (trimmed === handler.key) {
                return { success: false, reason: "INVALID_COMMAND" };
            }

            const prefix = handler.key + " ";
            if (trimmed.startsWith(prefix)) {
                const args = trimmed.slice(prefix.length).trim();
                if (!args) {
                    return { success: false, reason: "INVALID_COMMAND" };
                }
                return { success: true, command: handler.build(args) };
            }
        } else if (trimmed === handler.key) {
            return { success: true, command: handler.build() };
        }
    }

    return { success: false, reason: "INVALID_COMMAND" };
}

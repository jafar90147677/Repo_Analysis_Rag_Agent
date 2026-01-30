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

export function parseSlashCommand(input: string): SlashCommandParseResult {
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

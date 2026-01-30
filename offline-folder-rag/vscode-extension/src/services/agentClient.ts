import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const TOKEN_FILENAME = "agent_token.txt";
const MODE_STATE_FILENAME = "composer_mode.json";

const COMPOSER_MODES = ["auto", "rag", "tools"] as const;

function getIndexDir(): string {
    const envDir = process.env.RAG_INDEX_DIR;
    if (envDir && envDir.trim()) {
        return envDir;
    }

    const userProfile = process.env.USERPROFILE || os.homedir();
    return path.join(userProfile, ".offline_rag_index");
}

function getModeStateFilePath(): string {
    return path.join(getIndexDir(), MODE_STATE_FILENAME);
}

export type ComposerMode = (typeof COMPOSER_MODES)[number];

export function isComposerMode(value: unknown): value is ComposerMode {
    return (
        typeof value === "string" &&
        (COMPOSER_MODES as readonly string[]).includes(value)
    );
}

export function getTokenFilePath(): string {
    return path.join(getIndexDir(), TOKEN_FILENAME);
}

export function readAgentToken(): string | null {
    const tokenPath = getTokenFilePath();
    try {
        const token = fs.readFileSync(tokenPath, "utf8").trim();
        return token.length ? token : null;
    } catch {
        return null;
    }
}

export function readComposerMode(): ComposerMode | null {
    const statePath = getModeStateFilePath();
    try {
        const contents = fs.readFileSync(statePath, "utf8");
        const parsed = JSON.parse(contents);
        if (isComposerMode(parsed?.mode)) {
            return parsed.mode;
        }
    } catch {
        // ignore missing file or parse errors
    }

    return null;
}

export function writeComposerMode(mode: ComposerMode): void {
    const statePath = getModeStateFilePath();
    try {
        fs.mkdirSync(path.dirname(statePath), { recursive: true });
        fs.writeFileSync(statePath, JSON.stringify({ mode }), "utf8");
    } catch {
        // best effort persistence only
    }
}

export interface HealthResponse {
    indexing: boolean;
    indexed_files_so_far: number;
    estimated_total_files: number;
    last_index_completed_epoch_ms: number;
    ollama_ok: boolean;
    ripgrep_ok: boolean;
    chroma_ok: boolean;
}

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = readAgentToken();
    const headers = new Headers(options.headers);

    if (token) {
        headers.set("X-LOCAL-TOKEN", token);
    }

    return fetch(url, {
        ...options,
        headers,
    });
}

let healthPollingInterval: NodeJS.Timeout | undefined;

export function startHealthPolling(baseUrl: string, onUpdate: (health: HealthResponse) => void, onError: (error: any) => void) {
    if (healthPollingInterval) {
        return;
  }

    const poll = async () => {
        try {
            const response = await authenticatedFetch(`${baseUrl}/health`);
            if (!response.ok) {
                throw new Error(`Health check failed: ${response.statusText}`);
            }
            const health = await response.json() as HealthResponse;
            onUpdate(health);
            if (!health.indexing) {
                stopHealthPolling();
            }
        } catch (error) {
            onError(error);
            stopHealthPolling();
        }
    };

    // Start polling immediately
    poll();
    healthPollingInterval = setInterval(poll, 2000);
}

export function stopHealthPolling() {
    if (healthPollingInterval) {
        clearInterval(healthPollingInterval);
        healthPollingInterval = undefined;
    }
}

export async function sendMessageToAgent(message: string): Promise<void> {
    console.log('Sending message to agent:', message);
    // Implementation for sending message to agent
}

export function ask(question: string) {
  return fetch('/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
}

export function overview(question: string) {
  return fetch('/overview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
}

export function askWithOverride(question: string, modeOverride: string) {
  return fetch('/ask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      question,
      mode_override: modeOverride
    }),
  });
}

export function search(question: string) {
  return fetch('/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
}

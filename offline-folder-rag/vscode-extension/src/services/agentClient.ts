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

export interface IndexReport {
    indexed_files: string[];
    skipped_files: { path: string; reason: string }[];
    top_skip_reasons: { reason: string; count: number }[];
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

export async function getIndexReport(baseUrl: string): Promise<IndexReport> {
    const response = await authenticatedFetch(`${baseUrl}/index_report`);
    if (!response.ok) {
        throw new Error(`Failed to fetch index report: ${response.statusText}`);
    }
    return await response.json() as IndexReport;
}

export async function triggerIndex(baseUrl: string, mode: 'full' | 'incremental'): Promise<IndexReport | { status: string }> {
    const response = await authenticatedFetch(`${baseUrl}/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
    });
    
    if (!response.ok) {
        throw new Error(`Indexing failed: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.status === 'started' || result.status === 'in_progress') {
        return result;
    }
    
    return await getIndexReport(baseUrl);
}

let healthPollingInterval: NodeJS.Timeout | undefined;

export function startHealthPolling(
    baseUrl: string,
    onUpdate: (health: HealthResponse) => void,
    onError: (error: any) => void
) {
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
    console.log("Sending message to agent:", message);
    // Implementation for sending message to agent
}

export function ask(question: string, extraContext?: any) {
  return fetch('/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, extra_context: extraContext }),
  });
}

export function overview(question: string, extraContext?: any) {
  return fetch('/overview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, extra_context: extraContext }),
  });
}

export function askWithOverride(question: string, modeOverride: string, extraContext?: any) {
  return fetch('/ask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      question,
      mode_override: modeOverride,
      extra_context: extraContext
    }),
  });
}

export function search(question: string, extraContext?: any) {
  return fetch('/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, extra_context: extraContext }),
  });
}

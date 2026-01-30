import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const TOKEN_FILENAME = "agent_token.txt";

function getIndexDir(): string {
    const envDir = process.env.RAG_INDEX_DIR;
    if (envDir && envDir.trim()) {
        return envDir;
    }

    const userProfile = process.env.USERPROFILE || os.homedir();
    return path.join(userProfile, ".offline_rag_index");
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
        headers
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
            const health: HealthResponse = await response.json();
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

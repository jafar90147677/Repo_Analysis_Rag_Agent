import { authenticatedFetch } from "./agentClient";

const DEBOUNCE_MS = 60_000;
const RATE_LIMIT_MS = 5 * 60_000;
const HEALTH_POLL_MS = 5_000;

type AutoIndexSchedulerOptions = {
    triggerIndex: () => Promise<void>;
    getRootPath: () => string | undefined;
    agentBaseUrl: string;
};

export class AutoIndexScheduler {
    private lastStartTime = 0;
    private debounceTimer: NodeJS.Timeout | undefined;
    private isWaitingForHealth = false;
    private readonly triggerIndex: () => Promise<void>;
    private readonly getRootPath: () => string | undefined;
    private readonly agentBaseUrl: string;

    constructor(options: AutoIndexSchedulerOptions) {
        this.triggerIndex = options.triggerIndex;
        this.getRootPath = options.getRootPath;
        this.agentBaseUrl = options.agentBaseUrl;
    }

    public requestIndex(): void {
        if (this.isRateLimited()) {
            return;
        }

        this.clearDebounceTimer();
        this.debounceTimer = setTimeout(() => void this.startIndex(), DEBOUNCE_MS);
    }

    private isRateLimited(): boolean {
        return Date.now() - this.lastStartTime < RATE_LIMIT_MS;
    }

    private clearDebounceTimer(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = undefined;
        }
    }

    private async startIndex(): Promise<void> {
        if (this.isRateLimited() || this.isWaitingForHealth) {
            return;
        }

        const rootPath = this.getRootPath();
        if (!rootPath) {
            return;
        }

        if (!(await this.awaitHealthClear())) {
            return;
        }

        this.isWaitingForHealth = true;
        try {
            await this.triggerIndex();
            this.lastStartTime = Date.now();
        } finally {
            this.isWaitingForHealth = false;
        }
    }

    private async awaitHealthClear(): Promise<boolean> {
        while (true) {
            const health = await this.fetchHealth();
            if (!health) {
                return false;
            }

            if (!health.indexing) {
                return true;
            }

            await this.delay(HEALTH_POLL_MS);
        }
    }

    private async fetchHealth(): Promise<{ indexing: boolean } | null> {
        try {
            const response = await authenticatedFetch(`${this.agentBaseUrl}/health`);
            if (!response.ok) {
                return null;
            }

            return (await response.json()) as { indexing: boolean };
        } catch {
            return null;
        }
    }

    private async delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

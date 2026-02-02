/** Progress display (plain object/string, no React). */
export function getProgressState(phase: string, percent: number): { phase: string; percent: number } {
    return { phase, percent };
}

export function renderProgressHtml(phase: string, percent: number): string {
    return `<div class="confluence-progress"><span>${escapeHtml(phase)}</span><progress value="${percent}" max="100"></progress></div>`;
}

function escapeHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

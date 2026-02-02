/** Results display (plain object/string, no React). */
export interface ConfluenceResultItem {
    page_id?: string;
    url?: string;
    status: string;
}

export function renderResultsHtml(items: ConfluenceResultItem[]): string {
    const rows = items.map((r) => `<tr><td>${escapeHtml(r.status)}</td><td>${escapeHtml(r.url || "")}</td></tr>`).join("");
    return `<table class="confluence-results"><tbody>${rows}</tbody></table>`;
}

function escapeHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

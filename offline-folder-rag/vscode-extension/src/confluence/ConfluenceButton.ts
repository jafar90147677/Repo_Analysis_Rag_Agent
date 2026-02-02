/** Plain function returning HTML string (no React). */
export function renderConfluenceButton(label: string, disabled: boolean): string {
    return `<button class="confluence-publish" ${disabled ? "disabled" : ""}>${escapeHtml(label)}</button>`;
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

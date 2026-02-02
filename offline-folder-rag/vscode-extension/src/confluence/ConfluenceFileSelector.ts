/** Plain function returning simple object (no React). */
export function getFileSelectorState(files: string[], selected: string): { files: string[]; selected: string } {
    return { files, selected };
}

export function renderFileSelectorHtml(files: string[], selected: string): string {
    const options = files.map((f) => `<option value="${escapeAttr(f)}" ${f === selected ? "selected" : ""}>${escapeHtml(f)}</option>`).join("");
    return `<select class="confluence-file-selector">${options}</select>`;
}

function escapeHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s: string): string {
    return escapeHtml(s).replace(/"/g, "&quot;");
}

import path from "path";

/**
 * Normalize the provided workspace root path so hashing/indexing becomes deterministic.
 * - Resolves relative segments.
 * - Ensures consistent separators.
 * - Trims trailing slashes and lowercases on Windows platforms.
 */
export function normalizeRootPath(rootPath: string): string {
    if (!rootPath) {
        return "";
    }

    let normalized = path.resolve(rootPath);
    normalized = path.normalize(normalized);

    if (normalized.length > path.sep.length && normalized.endsWith(path.sep)) {
        normalized = normalized.slice(0, -path.sep.length);
    }

    if (process.platform === "win32") {
        normalized = normalized.toLowerCase();
    }

    return normalized;
}

import crypto from "crypto";
import fs from "fs";
import path from "path";

import { normalizeRootPath } from "../utils/pathNormalize";

export interface IndexGateConfig {
    storageRoot: string;
}

function getRepoId(normalizedRootPath: string): string {
    return crypto.createHash("sha256").update(normalizedRootPath).digest("hex");
}

export function getIndexDir(config: IndexGateConfig, rootPath: string): string {
    const normalizedRootPath = normalizeRootPath(rootPath);
    const repoId = getRepoId(normalizedRootPath);
    return path.join(config.storageRoot, "indexes", repoId);
}

export async function checkIndexExists(config: IndexGateConfig, rootPath: string): Promise<boolean> {
    const dir = getIndexDir(config, rootPath);
    try {
        await fs.promises.access(dir, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

export async function triggerFullIndex(
    config: IndexGateConfig,
    rootPath: string,
    onProgress?: (message: string) => void
): Promise<void> {
    const normalizedRootPath = normalizeRootPath(rootPath);
    const dir = getIndexDir(config, rootPath);
    await fs.promises.mkdir(path.dirname(dir), { recursive: true });
    await fs.promises.mkdir(dir, { recursive: true });
    onProgress?.("Index directory prepared.");

    const metadataPath = path.join(dir, "metadata.json");
    const metadata = {
        repoId: getRepoId(normalizedRootPath),
        rootPath: normalizedRootPath,
        indexedAt: new Date().toISOString(),
    };

    await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2), "utf-8");
    onProgress?.("Indexing complete.");
}

export { setIndexing, isIndexing, clearIndexing } from "./indexingState";

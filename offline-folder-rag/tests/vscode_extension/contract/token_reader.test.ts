import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, "..", "..", "..");
const serviceModulePath = path.join(
  repoRoot,
  "vscode-extension",
  "src",
  "services",
  "agentClient.ts"
);

async function loadService() {
  return import(pathToFileURL(serviceModulePath).href);
}

async function withTempDir(run: (dir: string) => Promise<void>) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "token-reader-"));
  try {
    await run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe("agentClient token reading", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("reads token using RAG_INDEX_DIR path", async () => {
    await withTempDir(async (tempDir) => {
      process.env.RAG_INDEX_DIR = tempDir;
      const { getTokenFilePath, readAgentToken } = await loadService();
      const tokenPath = getTokenFilePath();
      fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
      fs.writeFileSync(tokenPath, "abc123", "utf8");

      const token = readAgentToken();
      assert.strictEqual(token, "abc123");
    });
  });

  it("falls back to USERPROFILE/.offline_rag_index", async () => {
    await withTempDir(async (tempDir) => {
      delete process.env.RAG_INDEX_DIR;
      process.env.USERPROFILE = tempDir;

      const { getTokenFilePath, readAgentToken } = await loadService();
      const tokenPath = getTokenFilePath();
      fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
      fs.writeFileSync(tokenPath, "from_profile", "utf8");

      const token = readAgentToken();
      assert.strictEqual(token, "from_profile");
      assert.ok(tokenPath.startsWith(tempDir));
    });
  });
});

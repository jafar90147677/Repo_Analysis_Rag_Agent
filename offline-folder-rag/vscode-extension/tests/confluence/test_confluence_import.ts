/** Minimal command registration test: package.json includes confluence commands. */
import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";

describe("Confluence extension", () => {
    it("package.json contributes confluence commands", () => {
        const pkgPath = path.join(__dirname, "../../package.json");
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        const commands = pkg.contributes?.commands || [];
        const ids = commands.map((c: { command: string }) => c.command);
        assert.ok(ids.includes("offlineFolderRag.confluencePublish"), "confluencePublish command");
        assert.ok(ids.includes("offlineFolderRag.confluenceViewStatus"), "confluenceViewStatus command");
    });
});

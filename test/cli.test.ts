import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

test("inventory --format json emits machine-readable JSON", () => {
  const dir = mkdtempSync(join(tmpdir(), "rd-cli-"));
  try {
    writeFileSync(join(dir, "CLAUDE.md"), "- alpha unique rule\n");
    const r = spawnSync(process.execPath, ["--import", "tsx", "src/index.ts", "inventory", "--format", "json", "-p", dir], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    assert.equal(r.status, 0, r.stderr);
    const parsed = JSON.parse(r.stdout);
    assert.equal(parsed.cwd, dir);
    assert.deepEqual(parsed.ruleFiles, ["CLAUDE.md"]);
    assert.equal(parsed.rules[0].id, "R1");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

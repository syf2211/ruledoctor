#!/usr/bin/env node
/**
 * Session-end hook (Claude Code SessionEnd + Cursor sessionEnd).
 * stdin: hook JSON (cwd, transcript_path, …)
 * stdout: hook JSON with systemMessage summary
 */
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dir, "..");
const CLI = join(PKG_ROOT, "dist", "index.js");

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

const input = readStdin();
const cwd = input.cwd || input.project_dir || process.env.CLAUDE_PROJECT_DIR || process.cwd();
const session = input.transcript_path;

if (!existsSync(CLI)) {
  console.log(JSON.stringify({ continue: true, systemMessage: "RuleDoctor: dist/index.js missing, run npm run build." }));
  process.exit(0);
}

const outDir = join(cwd, ".ruledoctor");
mkdirSync(outDir, { recursive: true });
const htmlOut = join(outDir, "last-report.html");

const sessionArgs = session && existsSync(session) ? ["--session", session] : ["--last-session"];

const run = spawnSync(process.execPath, [CLI, "--cwd", cwd, ...sessionArgs, "--format", "html", "--out", htmlOut], {
  encoding: "utf8",
  cwd,
});

const term = spawnSync(process.execPath, [CLI, "--cwd", cwd, ...sessionArgs, "--format", "terminal"], {
  encoding: "utf8",
  cwd,
});

let summary = (term.stdout || term.stderr || "").trim().split("\n").slice(0, 12).join("\n");
if (!summary) summary = `RuleDoctor 报告: ${htmlOut}`;

if (process.platform === "darwin" && process.env.RULEDOCTOR_NO_OPEN !== "1") {
  spawnSync("open", [htmlOut], { stdio: "ignore" });
}

console.log(
  JSON.stringify({
    continue: true,
    systemMessage: `RuleDoctor 规则体检完成。报告: ${htmlOut}\n\n${summary}`,
  }),
);

process.exit(run.status === 0 ? 0 : 0);

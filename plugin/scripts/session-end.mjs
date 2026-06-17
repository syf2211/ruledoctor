#!/usr/bin/env node
/**
 * Session-end hook (Claude Code SessionEnd + Cursor sessionEnd).
 */
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = join(__dir, "..");

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

function resolveCli(cwd) {
  const installPath = join(cwd, ".ruledoctor", "install.json");
  if (existsSync(installPath)) {
    try {
      const o = JSON.parse(readFileSync(installPath, "utf8"));
      if (o.ruledoctorBin && existsSync(o.ruledoctorBin)) return { exe: process.execPath, argsPrefix: [o.ruledoctorBin] };
    } catch {
      /* ignore */
    }
  }
  const localDist = join(SKILL_ROOT, "dist", "index.js");
  if (existsSync(localDist)) return { exe: process.execPath, argsPrefix: [localDist] };
  const repoDist = join(SKILL_ROOT, "..", "..", "dist", "index.js");
  if (existsSync(repoDist)) return { exe: process.execPath, argsPrefix: [repoDist] };

  const which = spawnSync("sh", ["-c", "command -v ruledoctor 2>/dev/null"], { encoding: "utf8" });
  const bin = (which.stdout || "").trim();
  if (bin) return { exe: bin, argsPrefix: [] };

  return { exe: "npx", argsPrefix: ["--yes", "ruledoctor@0.1.0"] };
}

const input = readStdin();
const cwd = input.cwd || input.project_dir || process.env.CLAUDE_PROJECT_DIR || process.cwd();
const session = input.transcript_path;

const { exe, argsPrefix } = resolveCli(cwd);
const outDir = join(cwd, ".ruledoctor");
mkdirSync(outDir, { recursive: true });
const htmlOut = join(outDir, "last-report.html");
const sessionArgs = session && existsSync(session) ? ["--session", session] : ["--last-session"];
const baseArgs = [...argsPrefix, "--cwd", cwd, ...sessionArgs];

const run = spawnSync(exe, [...baseArgs, "--format", "html", "--out", htmlOut], {
  encoding: "utf8",
  cwd,
  shell: exe === "npx",
});

const term = spawnSync(exe, [...baseArgs, "--format", "terminal"], {
  encoding: "utf8",
  cwd,
  shell: exe === "npx",
});

let summary = (term.stdout || term.stderr || run.stderr || "").trim().split("\n").slice(0, 12).join("\n");
if (!summary) summary = `RuleDoctor 报告: ${htmlOut}`;

if (process.platform === "darwin" && process.env.RULEDOCTOR_NO_OPEN !== "1" && existsSync(htmlOut)) {
  spawnSync("open", [htmlOut], { stdio: "ignore" });
}

console.log(
  JSON.stringify({
    continue: true,
    systemMessage: `RuleDoctor 规则体检完成。报告: ${htmlOut}\n\n${summary}`,
  }),
);

process.exit(0);

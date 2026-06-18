#!/usr/bin/env node
/**
 * Re-inject project rules after SessionStart / PreCompact (compaction).
 */
import { readFileSync, existsSync, readdirSync, realpathSync } from "node:fs";
import { resolve, join, relative, isAbsolute } from "node:path";

const ROOT_RULES = [
  "CLAUDE.md",
  "AGENTS.md",
  ".cursorrules",
  "CONTRIBUTING.md",
  ".github/copilot-instructions.md",
  "copilot-instructions.md",
];

const MAX_CHARS = 12_000;

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

function loadRequiredReads(cwd) {
  for (const name of [".ruledoctor.json", ".ruledoctor.jsonc", "ruledoctor.config.json"]) {
    const p = resolve(cwd, name);
    if (!existsSync(p)) continue;
    try {
      const raw = readFileSync(p, "utf8").replace(/\/\/.*$/gm, "");
      const o = JSON.parse(raw);
      if (Array.isArray(o.required_reads)) return o.required_reads.filter((x) => typeof x === "string");
    } catch {
      /* ignore */
    }
  }
  return [];
}

function realpathOrResolve(path) {
  try {
    return realpathSync.native(path);
  } catch {
    return resolve(path);
  }
}

function isInsideDir(parent, child) {
  const rel = relative(parent, child);
  return rel === "" || (!!rel && !rel.startsWith("..") && !isAbsolute(rel));
}

function addSafePath(paths, realCwd, candidate) {
  if (!existsSync(candidate)) return;
  const real = realpathOrResolve(candidate);
  if (isInsideDir(realCwd, real)) paths.add(real);
}

function discoverRulePaths(cwd) {
  const paths = new Set();
  const root = resolve(cwd);
  const realRoot = realpathOrResolve(root);
  for (const rel of ROOT_RULES) {
    addSafePath(paths, realRoot, resolve(root, rel));
  }
  const cursorDir = resolve(root, ".cursor/rules");
  if (existsSync(cursorDir)) {
    for (const f of readdirSync(cursorDir)) {
      if (f.endsWith(".md") || f.endsWith(".mdc")) addSafePath(paths, realRoot, join(cursorDir, f));
    }
  }
  for (const rel of loadRequiredReads(cwd)) {
    const trimmed = rel.trim();
    if (!trimmed || trimmed.includes("\0") || isAbsolute(trimmed)) continue;
    const p = resolve(root, trimmed);
    if (!isInsideDir(root, p)) continue;
    addSafePath(paths, realRoot, p);
  }
  return [...paths].sort();
}

function buildContext(cwd) {
  const files = discoverRulePaths(cwd);
  if (files.length === 0) {
    return "RuleDoctor: 未发现规则文件。请添加 CLAUDE.md / .cursorrules，或在 .ruledoctor.json 配置 required_reads。";
  }
  const chunks = [];
  for (const p of files) {
    try {
      chunks.push(`## ${p.replace(cwd + "/", "")}\n${readFileSync(p, "utf8").trim().slice(0, 4000)}`);
    } catch {
      /* ignore */
    }
  }
  const header =
    "【RuleDoctor · 规则锚点】压缩或新会话后仍有效。Agent：已读文件见下；对用户默认只汇报「读了哪些文件 + 最多 3 条硬约束」，除非用户要求展开。\n\n";
  let text = header + chunks.join("\n\n");
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS) + "\n\n…(已截断，请 Read 完整文件)";
  return text;
}

const input = readStdin();
const cwd = input.cwd || input.project_dir || process.cwd();
const event = input.hook_event_name || input.hookEventName || "SessionStart";
const ctx = buildContext(cwd);

console.log(
  JSON.stringify({
    continue: true,
    systemMessage: "RuleDoctor 已注入规则锚点（含 required_reads）。",
    hookSpecificOutput: { hookEventName: event, additionalContext: ctx },
  }),
);

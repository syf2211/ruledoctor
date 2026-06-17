#!/usr/bin/env node
/**
 * Idempotently install RuleDoctor hooks into user-level Claude + Cursor config.
 * Run once after installing the skill to ~/.claude/skills/ruledoctor (or from repo copy).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPTS = join(SKILL_ROOT, "scripts");
const reinject = join(SCRIPTS, "reinject-rules.mjs");
const guard = join(SCRIPTS, "rule-guard.mjs");
const sessionEnd = join(SCRIPTS, "session-end.mjs");

const home = process.env.HOME;
if (!home) {
  console.error("RuleDoctor bootstrap: HOME is not set.");
  process.exit(1);
}

const claudeSettings = join(home, ".claude", "settings.json");
const cursorHooks = join(home, ".cursor", "hooks.json");

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    console.error(`RuleDoctor bootstrap: could not parse ${path} — fix JSON and re-run.`);
    process.exit(1);
  }
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

function mergeClaudeCommandHook(settings, event, marker, hookScript, timeout) {
  const command = `node "${hookScript}" # ${marker}`;
  const hooks = settings.hooks ?? {};
  const existing = hooks[event] ?? [];
  if (existing.some((e) => (e.hooks ?? []).some((h) => h.command?.includes(marker)))) {
    return false;
  }
  hooks[event] = [...existing, { hooks: [{ type: "command", command, timeout }] }];
  settings.hooks = hooks;
  return true;
}

function mergeClaudeSessionEnd(settings, marker, hookScript) {
  const command = `node "${hookScript}" # ${marker}`;
  const hooks = settings.hooks ?? {};
  const existing = hooks.SessionEnd ?? [];
  if (existing.some((e) => (e.hooks ?? []).some((h) => h.command?.includes(marker)))) {
    return false;
  }
  hooks.SessionEnd = [...existing, { hooks: [{ type: "command", command, timeout: 120 }] }];
  settings.hooks = hooks;
  return true;
}

function mergeClaudeBashGuard(settings, marker, guardScript) {
  const command = `node "${guardScript}" # ${marker}`;
  const hooks = settings.hooks ?? {};
  const existing = hooks.PreToolUse ?? [];
  if (existing.some((e) => e.matcher === "Bash" && (e.hooks ?? []).some((h) => h.command?.includes(marker)))) {
    return false;
  }
  hooks.PreToolUse = [...existing, { matcher: "Bash", hooks: [{ type: "command", command, timeout: 15 }] }];
  settings.hooks = hooks;
  return true;
}

function mergeCursorHook(doc, event, marker, hookScript, timeout) {
  const command = `node "${hookScript}" # ${marker}`;
  doc.version = doc.version ?? 1;
  const hooks = doc.hooks ?? {};
  const existing = hooks[event] ?? [];
  if (existing.some((e) => e.command?.includes(marker))) return false;
  hooks[event] = [...existing, { command, timeout }];
  doc.hooks = hooks;
  return true;
}

let claudeChanged = false;
const claude = readJson(claudeSettings, {});
if (mergeClaudeCommandHook(claude, "SessionStart", "ruledoctor-reinject", reinject, 30)) claudeChanged = true;
if (mergeClaudeCommandHook(claude, "PreCompact", "ruledoctor-reinject", reinject, 30)) claudeChanged = true;
if (mergeClaudeBashGuard(claude, "ruledoctor-guard", guard)) claudeChanged = true;
if (mergeClaudeSessionEnd(claude, "ruledoctor-session-end", sessionEnd)) claudeChanged = true;
if (claudeChanged) writeJson(claudeSettings, claude);

let cursorChanged = false;
const cursor = readJson(cursorHooks, { version: 1, hooks: {} });
if (mergeCursorHook(cursor, "sessionStart", "ruledoctor-reinject", reinject, 30)) cursorChanged = true;
if (mergeCursorHook(cursor, "preCompact", "ruledoctor-reinject", reinject, 30)) cursorChanged = true;
if (mergeCursorHook(cursor, "beforeShellExecution", "ruledoctor-guard", guard, 15)) cursorChanged = true;
if (mergeCursorHook(cursor, "sessionEnd", "ruledoctor-session-end", sessionEnd, 120)) cursorChanged = true;
if (cursorChanged) writeJson(cursorHooks, cursor);

console.log("\n  RuleDoctor · bootstrap 完成\n");
console.log(`  SKILL_ROOT: ${SKILL_ROOT}`);
console.log(`  Claude Code: ${claudeSettings}${claudeChanged ? " (已更新)" : " (hooks 已存在，跳过)"}`);
console.log(`  Cursor:      ${cursorHooks}${cursorChanged ? " (已更新)" : " (hooks 已存在，跳过)"}`);
console.log("\n  Hooks: SessionStart/PreCompact/sessionStart/preCompact → reinject-rules");
console.log("         PreToolUse(Bash)/beforeShellExecution → rule-guard");
console.log("         SessionEnd/sessionEnd → session-end\n");

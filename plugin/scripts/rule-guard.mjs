#!/usr/bin/env node
/**
 * Block shell commands that violate .ruledoctor.json forbid-command checks.
 * Claude Code: PreToolUse (Bash) · permissionDecision deny
 * Cursor: beforeShellExecution · permission deny
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

function loadForbidCommands(cwd) {
  const files = [".ruledoctor.json", ".ruledoctor.jsonc", "ruledoctor.config.json"];
  for (const f of files) {
    const p = resolve(cwd, f);
    if (!existsSync(p)) continue;
    try {
      const raw = readFileSync(p, "utf8").replace(/\/\/.*$/gm, "");
      const o = JSON.parse(raw);
      const checks = Array.isArray(o.checks) ? o.checks : [];
      return checks
        .filter((c) => c && c.type === "forbid-command" && typeof c.command === "string")
        .map((c) => ({ needle: c.command, message: c.message || `禁止的命令: ${c.command}` }));
    } catch {
      return [];
    }
  }
  return [];
}

const input = readStdin();
const cwd = input.cwd || input.project_dir || process.cwd();
const command =
  input.command ||
  input.tool_input?.command ||
  input.toolInput?.command ||
  input.shell_command ||
  "";

if (!command || typeof command !== "string") {
  process.exit(0);
}

const rules = loadForbidCommands(cwd);
for (const r of rules) {
  if (!command.includes(r.needle)) continue;
  const msg = `RuleDoctor: ${r.message}`;
  const hookEvent = input.hook_event_name || input.hookEventName || "";

  if (hookEvent === "PreToolUse" || input.tool_name === "Bash" || input.toolName === "Bash") {
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: msg,
        },
        systemMessage: msg,
      }),
    );
    process.exit(2);
  }

  // Cursor beforeShellExecution
  console.log(
    JSON.stringify({
      permission: "deny",
      user_message: msg,
      agent_message: msg,
    }),
  );
  process.exit(2);
}

process.exit(0);

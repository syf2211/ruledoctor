#!/usr/bin/env node
/**
 * Re-inject project rules after SessionStart / PreCompact (compaction).
 * Keeps hard rules in context when the model would otherwise "forget" CLAUDE.md.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const RULE_FILES = [
  "CLAUDE.md",
  "AGENTS.md",
  ".cursorrules",
  ".cursor/rules/project.md",
];

const MAX_CHARS = 12_000;

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

function discoverRules(cwd) {
  const chunks = [];
  for (const rel of RULE_FILES) {
    const p = resolve(cwd, rel);
    if (!existsSync(p)) continue;
    try {
      chunks.push(`## ${rel}\n${readFileSync(p, "utf8").trim()}`);
    } catch {
      /* ignore */
    }
  }
  return chunks.join("\n\n");
}

function loadRulesAnchor() {
  const candidates = [];
  if (process.env.RULEDOCTOR_SKILL_ROOT) {
    candidates.push(resolve(process.env.RULEDOCTOR_SKILL_ROOT, "rules-anchor.md"));
  }
  const home = process.env.HOME;
  if (home) {
    candidates.push(resolve(home, ".claude/skills/ruledoctor/rules-anchor.md"));
  }
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    try {
      return readFileSync(p, "utf8").trim();
    } catch {
      /* ignore */
    }
  }
  return null;
}

function buildContext(cwd) {
  let body = discoverRules(cwd);
  if (!body) {
    const anchor = loadRulesAnchor();
    if (anchor) {
      body = `## rules-anchor.md (RuleDoctor 默认)\n${anchor}`;
    }
  }
  if (!body) {
    return "RuleDoctor: 本项目未发现 CLAUDE.md / AGENTS.md / .cursorrules。请运行 `ruledoctor setup -p .` 生成规则文件。";
  }
  const header =
    "【RuleDoctor · 规则锚点】上下文压缩或新会话后，以下规则仍然有效。执行任何工具或改代码前必须遵守；若与用户指令冲突，先说明再征求确认。\n\n";
  let text = header + body;
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS) + "\n\n…(规则已截断，请 Read 完整规则文件)";
  return text;
}

const input = readStdin();
const cwd = input.cwd || input.project_dir || process.cwd();
const event = input.hook_event_name || input.hookEventName || "SessionStart";
const ctx = buildContext(cwd);

const out = {
  continue: true,
  systemMessage: "RuleDoctor 已重新注入项目规则（抗 compaction）。",
  hookSpecificOutput: {
    hookEventName: event,
    additionalContext: ctx,
  },
};

console.log(JSON.stringify(out));

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverRuleFiles } from "./rules.js";
import { CLAUDE_MD_TEMPLATE, RULEDOCTOR_JSON_STARTER } from "./templates.js";

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export interface SetupOptions {
  cwd: string;
  yes: boolean;
  noHook: boolean;
  userHook: boolean;
}

export interface SetupResult {
  cwd: string;
  createdClaudeMd: boolean;
  createdRuledoctorJson: boolean;
  hookInstalled: boolean;
  hookPath: string | null;
  settingsPath: string | null;
  cursorHookInstalled: boolean;
  cursorHooksPath: string | null;
  ruledoctorBin: string;
}

export function setupCmd(opts: SetupOptions): SetupResult {
  const cwd = resolve(opts.cwd);
  mkdirSync(join(cwd, ".ruledoctor"), { recursive: true });

  const ruledoctorBin = resolve(PKG_ROOT, "dist/index.js");
  if (!existsSync(ruledoctorBin)) {
    throw new Error(`CLI not built: ${ruledoctorBin} — run npm run build in the ruledoctor repo first.`);
  }

  writeFileSync(
    join(cwd, ".ruledoctor", "install.json"),
    JSON.stringify({ ruledoctorRoot: PKG_ROOT, ruledoctorBin, installedAt: new Date().toISOString() }, null, 2),
  );

  let createdClaudeMd = false;
  if (discoverRuleFiles(cwd, (p) => existsSync(p)).length === 0) {
    const dest = join(cwd, "CLAUDE.md");
    writeFileSync(dest, CLAUDE_MD_TEMPLATE);
    createdClaudeMd = true;
  }

  let createdRuledoctorJson = false;
  const configDest = join(cwd, ".ruledoctor.json");
  if (!existsSync(configDest)) {
    writeFileSync(configDest, RULEDOCTOR_JSON_STARTER);
    createdRuledoctorJson = true;
  }

  let hookInstalled = false;
  let hookPath: string | null = null;
  let settingsPath: string | null = null;
  let cursorHookInstalled = false;
  let cursorHooksPath: string | null = null;

  if (!opts.noHook) {
    const sessionEnd = join(PKG_ROOT, "scripts", "session-end.mjs");
    const reinject = join(PKG_ROOT, "scripts", "reinject-rules.mjs");
    const guard = join(PKG_ROOT, "scripts", "rule-guard.mjs");

    settingsPath = opts.userHook
      ? join(process.env.HOME ?? "", ".claude", "settings.json")
      : join(cwd, ".claude", "settings.json");
    mkdirSync(dirname(settingsPath), { recursive: true });
    mergeSessionEndHook(settingsPath, sessionEnd, cwd);
    mergeClaudeCommandHook(settingsPath, "SessionStart", "ruledoctor-reinject", reinject, 30);
    mergeClaudeCommandHook(settingsPath, "PreCompact", "ruledoctor-reinject", reinject, 30);
    mergeClaudeBashGuard(settingsPath, guard);
    hookInstalled = true;
    hookPath = sessionEnd;

    cursorHooksPath = join(cwd, ".cursor", "hooks.json");
    mkdirSync(dirname(cursorHooksPath), { recursive: true });
    mergeCursorHook(cursorHooksPath, "sessionEnd", "ruledoctor-session-end", sessionEnd, 120);
    mergeCursorHook(cursorHooksPath, "sessionStart", "ruledoctor-reinject", reinject, 30);
    mergeCursorHook(cursorHooksPath, "preCompact", "ruledoctor-reinject", reinject, 30);
    mergeCursorHook(cursorHooksPath, "beforeShellExecution", "ruledoctor-guard", guard, 15);
    cursorHookInstalled = true;
  }

  return {
    cwd,
    createdClaudeMd,
    createdRuledoctorJson,
    hookInstalled,
    hookPath,
    settingsPath,
    cursorHookInstalled,
    cursorHooksPath,
    ruledoctorBin,
  };
}

function mergeSessionEndHook(settingsPath: string, hookScript: string, projectCwd: string) {
  const marker = "ruledoctor-session-end";
  const command = `node "${hookScript}" # ${marker} project=${projectCwd}`;

  let settings: Record<string, unknown> = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, "utf8")) as Record<string, unknown>;
    } catch {
      throw new Error(`Could not parse ${settingsPath} — fix JSON and re-run setup.`);
    }
  }

  const hooks = (settings.hooks as Record<string, unknown>) ?? {};
  const existing = (hooks.SessionEnd as HookEntry[]) ?? [];

  const already = existing.some((e) =>
    (e.hooks ?? []).some((h) => typeof h.command === "string" && h.command.includes(marker)),
  );
  if (already) return;

  const entry: HookEntry = {
    hooks: [
      {
        type: "command",
        command,
        timeout: 120,
      },
    ],
  };

  settings.hooks = { ...hooks, SessionEnd: [...existing, entry] };
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
}

function mergeClaudeCommandHook(
  settingsPath: string,
  event: string,
  marker: string,
  hookScript: string,
  timeout: number,
) {
  const command = `node "${hookScript}" # ${marker}`;
  let settings: Record<string, unknown> = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, "utf8")) as Record<string, unknown>;
    } catch {
      throw new Error(`Could not parse ${settingsPath} — fix JSON and re-run setup.`);
    }
  }
  const hooks = (settings.hooks as Record<string, unknown>) ?? {};
  const existing = (hooks[event] as HookEntry[]) ?? [];
  if (existing.some((e) => (e.hooks ?? []).some((h) => h.command?.includes(marker)))) return;
  const entry: HookEntry = { hooks: [{ type: "command", command, timeout }] };
  settings.hooks = { ...hooks, [event]: [...existing, entry] };
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
}

function mergeClaudeBashGuard(settingsPath: string, guardScript: string) {
  const marker = "ruledoctor-guard";
  const command = `node "${guardScript}" # ${marker}`;
  let settings: Record<string, unknown> = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, "utf8")) as Record<string, unknown>;
    } catch {
      throw new Error(`Could not parse ${settingsPath} — fix JSON and re-run setup.`);
    }
  }
  const hooks = (settings.hooks as Record<string, unknown>) ?? {};
  const existing = (hooks.PreToolUse as HookEntry[]) ?? [];
  if (existing.some((e) => e.matcher === "Bash" && (e.hooks ?? []).some((h) => h.command?.includes(marker)))) return;
  const entry: HookEntry = {
    matcher: "Bash",
    hooks: [{ type: "command", command, timeout: 15 }],
  };
  settings.hooks = { ...hooks, PreToolUse: [...existing, entry] };
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
}

function mergeCursorHook(
  hooksPath: string,
  event: string,
  marker: string,
  hookScript: string,
  timeout: number,
) {
  const command = `node "${hookScript}" # ${marker}`;
  let doc: { version?: number; hooks?: Record<string, HookDef[]> } = { version: 1, hooks: {} };
  if (existsSync(hooksPath)) {
    doc = JSON.parse(readFileSync(hooksPath, "utf8")) as typeof doc;
  }
  doc.version = doc.version ?? 1;
  const hooks = doc.hooks ?? {};
  const existing = hooks[event] ?? [];
  if (existing.some((e) => e.command?.includes(marker))) return;
  hooks[event] = [...existing, { command, timeout }];
  doc.hooks = hooks;
  writeFileSync(hooksPath, JSON.stringify(doc, null, 2) + "\n");
}

interface HookDef {
  command?: string;
  type?: string;
  timeout?: number;
}

interface HookEntry {
  matcher?: string;
  hooks?: { type: string; command: string; timeout?: number }[];
}

export function printSetupSummary(r: SetupResult) {
  console.log("\n  RuleDoctor · setup 完成\n");
  console.log(`  项目: ${r.cwd}`);
  if (r.createdClaudeMd) console.log("  ✓ 已生成 CLAUDE.md（通用规则文件，Cursor / Claude / Codex 都可读）");
  if (r.createdRuledoctorJson) console.log("  ✓ 已生成 .ruledoctor.json（禁止 force push 等基础检查）");
  if (r.hookInstalled) {
    console.log(`  ✓ Claude Code SessionEnd → ${r.settingsPath}`);
  }
  if (r.cursorHookInstalled) {
    console.log(`  ✓ Cursor sessionEnd → ${r.cursorHooksPath}`);
  }
  if (r.hookInstalled || r.cursorHookInstalled) {
    console.log("    SessionEnd：自动 HTML 报告 · SessionStart/PreCompact：重新注入规则 · Bash：拦截违禁命令");
  }
  console.log("\n  Codex：结束会话后在本项目目录执行一条即可（或装 alias）：");
  console.log(`    node "${r.ruledoctorBin}" --cwd "${r.cwd}" --last-session`);
  console.log("\n  随时手动体检（自动找 Claude / Codex / Cursor 最近一次会话）：");
  console.log(`    node "${r.ruledoctorBin}" --cwd "${r.cwd}" --last-session\n`);
}

#!/usr/bin/env node
import { Command } from "commander";
import { writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseRulesFile, discoverRuleFiles, fileLabel } from "./rules.js";
import { buildCorpus, discoverSessionFiles, scoreReadRate } from "./readRate.js";
import { loadConfig, runChecks } from "./compliance.js";
import { buildReport, renderHTML, renderJSON, renderTerminal } from "./report.js";
import { setupCmd, printSetupSummary } from "./setup.js";
import { findLatestSessionForProject, listSessionsForProject } from "./sessionSources.js";
import { basename } from "node:path";

const VERSION = "0.1.0";

const program = new Command();

program
  .name("ruledoctor")
  .description("Coverage for your AI coding rules. 测你的 .cursorrules / CLAUDE.md 到底有没有被模型读到、有没有被遵守。")
  .version(VERSION);

program
  .option("--rules <paths>", "comma-separated rules file(s)", "")
  .option("--session <path>", "session log file / dir / glob (default: auto-detect ~/.claude/projects)")
  .option("--cwd <dir>", "project root", process.cwd())
  .option("--config <path>", ".ruledoctor.json path (default: auto-detect)")
  .option("--format <fmt>", "terminal | json | html", "terminal")
  .option("--out <file>", "write the report to a file instead of stdout")
  .option("--min-score <n>", "CI gate: exit code 1 if the score is below N", (v) => parseInt(v, 10))
  .option("--no-read-rate", "skip session-log read-rate analysis")
  .option("--last-session", "use the newest session log for this --cwd (Claude / Codex / Cursor)")
  .action(async (opts) => {
    try {
      await runCheck(opts);
    } catch (e) {
      console.error(`\n  ✗ ${((e as Error).message || String(e)).trim()}\n`);
      process.exit(2);
    }
  });

program
  .command("init")
  .description("create a .ruledoctor.json template in the project root")
  .option("--cwd <dir>", "project root", process.cwd())
  .action((opts) => initCmd(resolve(opts.cwd)));

program
  .command("inventory")
  .description("规则面板：列出发现的规则文件、每条规则来源、以及是否配置了遵守检查")
  .requiredOption("-p, --project <dir>", "project root", process.cwd())
  .option("--rules <paths>", "comma-separated rules file(s)", "")
  .option("--config <path>", ".ruledoctor.json path (default: auto-detect)")
  .option("--format <fmt>", "terminal | json", "terminal")
  .action((opts) => inventoryCmd({ ...opts, cwd: opts.project }));

program
  .command("setup")
  .description("初始化项目：规则文件 + 遵守检查 + Claude/Cursor 会话结束自动体检")
  .option("-p, --project <dir>", "project root", process.cwd())
  .option("--yes", "non-interactive", false)
  .option("--no-hook", "do not write Claude Code SessionEnd hook", false)
  .option("--user-hook", "write hook to ~/.claude/settings.json instead of project .claude/", false)
  .action((opts) => {
    try {
      const result = setupCmd({
        cwd: resolve(opts.project),
        yes: Boolean(opts.yes),
        noHook: Boolean(opts.noHook),
        userHook: Boolean(opts.userHook),
      });
      printSetupSummary(result);
    } catch (e) {
      console.error(`\n  ✗ ${((e as Error).message || String(e)).trim()}\n`);
      process.exit(2);
    }
  });

program
  .command("doctor")
  .description("查看本项目能被 RuleDoctor 找到的会话（Claude / Codex / Cursor）")
  .option("-p, --project <dir>", "project root", process.cwd())
  .action((opts) => doctorCmd(resolve(opts.project)));

interface CheckOpts {
  rules: string;
  session: string | undefined;
  cwd: string;
  config: string | undefined;
  format: string;
  out: string | undefined;
  minScore: number | undefined;
  readRate: boolean;
  lastSession: boolean;
}

async function runCheck(opts: CheckOpts) {
  const cwd = resolve(opts.cwd);

  // 1) rules
  const ruleFiles = opts.rules
    ? opts.rules.split(",").map((s) => s.trim()).filter(Boolean).map((p) => resolve(p))
    : discoverRuleFiles(cwd, (p) => existsSync(p));
  if (ruleFiles.length === 0) {
    throw new Error(
      `No rules file found in ${cwd}. Pass --rules <file> or add a CLAUDE.md / AGENTS.md / .cursorrules.`,
    );
  }
  const rules = ruleFiles.flatMap((f) => parseRulesFile(f));
  if (rules.length === 0) {
    throw new Error(`Parsed 0 rules from ${ruleFiles.join(", ")}. Make sure there are list items or sentences.`);
  }

  // 2) read-rate (session logs)
  const notes: string[] = [];
  let corpusText = "";
  let readEnabled = opts.readRate;
  if (readEnabled) {
    let sessionArg = opts.session ? resolve(opts.session) : undefined;
    if (!sessionArg && opts.lastSession) {
      const ref = findLatestSessionForProject(cwd);
      sessionArg = ref?.path;
      if (ref) {
        notes.push(`session: ${ref.source} · ${basename(ref.path)}`);
      } else {
        notes.push("⚠ --last-session: no session logs found for this project (Claude / Codex / Cursor)");
      }
    }
    let files: string[] = [];
    if (sessionArg) {
      files = await discoverSessionFiles(sessionArg, cwd);
    } else if (!opts.lastSession) {
      files = await discoverSessionFiles(undefined, cwd);
    }
    if (files.length === 0) {
      notes.push("⚠ no session logs found — read-rate unavailable (pass --session <path> or run inside a project with ~/.claude logs)");
      readEnabled = false;
    } else {
      const corpus = buildCorpus(files);
      corpusText = corpus.text;
      notes.push(`read-rate: scanned ${corpus.lines} lines across ${files.length} session log(s)`);
    }
  }
  const read = readEnabled
    ? scoreReadRate(rules, corpusText)
    : rules.map((r) => ({ ruleId: r.id, confidence: 0, present: false, matched: 0, total: 0 }));

  // 3) compliance (deterministic checkers)
  const { config, source } = loadConfig(opts.config, cwd);
  const { results: compliance, orphans } = await runChecks(rules, config.checks, cwd, corpusText);
  notes.push(`rules: ${ruleFiles.length} file(s)${source ? ` · checks: ${config.checks.length} from ${source}` : " · no .ruledoctor.json (compliance all unknown)"}`);
  if (orphans.length) notes.push(`⚠ ${orphans.length} check(s) matched no rule: ${orphans.map((o) => `"${o.rule}"`).join(", ")}`);

  // 4) report
  const report = buildReport(rules, read, compliance, notes);

  let output: string;
  switch (opts.format) {
    case "json":
      output = renderJSON(report);
      break;
    case "html":
      output = renderHTML(report);
      break;
    case "terminal":
    default:
      output = renderTerminal(report);
      break;
  }

  if (opts.out) {
    writeFileSync(opts.out, output);
    console.error(`\n  ✓ report written to ${opts.out} (score ${report.score}/100)\n`);
  } else {
    console.log(output);
  }

  // 5) CI gate
  if (opts.minScore !== undefined && report.score < opts.minScore) {
    console.error(`\n  ✗ score ${report.score} < required ${opts.minScore} — failing the build.\n`);
    process.exit(1);
  }
}

const TEMPLATE = `{
  // RuleDoctor checks — link each check to a rule by a distinctive substring.
  // Types:
  //   forbid-regex   pattern must NOT appear in the matched files
  //   require-regex  pattern MUST appear somewhere
  //   forbid-command a shell command substring must NOT have been run in the session
  "checks": [
    {
      "rule": "整数「分」",
      "type": "forbid-regex",
      "pattern": "\\\\d+\\\\.\\\\d+",
      "paths": ["src/**/*.ts"],
      "message": "发现浮点金额,规则要求用整数「分」"
    },
    {
      "rule": "git push --force",
      "type": "forbid-command",
      "command": "push --force",
      "message": "会话中出现了被禁止的 force push"
    }
  ]
}
`;

function initCmd(cwd: string) {
  const dest = resolve(cwd, ".ruledoctor.json");
  if (existsSync(dest)) {
    console.error(`\n  ✗ ${dest} already exists.\n`);
    process.exit(2);
  }
  writeFileSync(dest, TEMPLATE);
  console.log(`\n  ✓ created ${dest}\n  edit it, then run: ruledoctor\n`);
}

const NOT_SCANNED = [
  ".cursor/rules/*.mdc",
  ".claude/rules/",
  "Claude Skills / Scale 工作流步骤（除非写入 CLAUDE.md 等）",
  "~/.claude/settings.json、hooks 配置",
  "用户全局 Cursor / Claude 账号级 rules",
  "厂商 system prompt（仅当原文出现在会话 jsonl 时可能参与读到率匹配）",
];

function inventoryCmd(opts: { cwd: string; rules: string; config?: string; format: string }) {
  const cwd = resolve(opts.cwd);
  const ruleFiles = opts.rules
    ? opts.rules.split(",").map((s) => s.trim()).filter(Boolean).map((p) => resolve(p))
    : discoverRuleFiles(cwd, (p) => existsSync(p));
  const rules = ruleFiles.flatMap((f) => parseRulesFile(f));
  const { config, source: configSource } = loadConfig(opts.config, cwd);

  const checkerForRule = (text: string): string | null => {
    for (const c of config.checks) {
      if (text.toLowerCase().includes(c.rule.toLowerCase())) return c.type;
    }
    return null;
  };

  if (opts.format === "json") {
    console.log(
      JSON.stringify(
        {
          cwd,
          ruleFiles: ruleFiles.map(fileLabel),
          configFile: configSource,
          checks: config.checks.length,
          notScannedSources: NOT_SCANNED,
          rules: rules.map((r) => ({
            id: r.id,
            text: r.text,
            section: r.section,
            source: fileLabel(r.source),
            checker: checkerForRule(r.text),
          })),
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log("\n  RuleDoctor · 规则面板 (inventory)\n");
  console.log(`  项目: ${cwd}\n`);
  if (ruleFiles.length === 0) {
    console.log("  ✗ 未发现规则文件。可添加 CLAUDE.md / AGENTS.md / .cursorrules 等，或 --rules 指定。\n");
    process.exit(2);
  }
  console.log("  【会扫描的规则文件】");
  for (const f of ruleFiles) console.log(`    · ${fileLabel(f)}`);
  console.log(
    `\n  【遵守检查配置】${configSource ? `${config.checks.length} 项 (${fileLabel(configSource)})` : "无 .ruledoctor.json — 遵守率全部为「—」"}`,
  );
  console.log("\n  【规则列表】读到率依赖会话 jsonl；遵守率仅对已配置 checker 的规则生效\n");
  for (const r of rules) {
    const chk = checkerForRule(r.text);
    const chkLabel = chk ? `checker: ${chk}` : "无 checker（仅读到率）";
    const sec = r.section ? ` · ${r.section}` : "";
    console.log(`  ${r.id}  [${fileLabel(r.source)}${sec}]`);
    console.log(`      ${r.text}`);
    console.log(`      ${chkLabel}\n`);
  }
  console.log("  【当前版本不会自动扫描的来源】");
  for (const x of NOT_SCANNED) console.log(`    · ${x}`);
  console.log("\n  详见: docs/使用说明.md\n");
}

function doctorCmd(cwd: string) {
  const list = listSessionsForProject(cwd);
  console.log("\n  RuleDoctor · doctor\n");
  console.log(`  项目: ${cwd}\n`);
  if (list.length === 0) {
    console.log("  未找到会话。请用 Cursor、Claude Code 或 Codex 在本项目里聊过天后再试。\n");
    console.log("  若刚聊完仍为空：Codex 需结束会话；Cursor 需有 agent 对话记录。\n");
    return;
  }
  console.log("  已发现的会话（新 → 旧，--last-session 用第一条）：\n");
  for (const s of list.slice(0, 10)) {
    const when = new Date(s.mtimeMs).toISOString().slice(0, 19).replace("T", " ");
    console.log(`    ${s.source.padEnd(6)}  ${when}  ${basename(s.path)}`);
    console.log(`            ${s.path}`);
  }
  console.log("");
}

program.parseAsync(process.argv);

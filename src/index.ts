#!/usr/bin/env node
import { Command } from "commander";
import { writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseRulesFile, discoverRuleFiles } from "./rules.js";
import { buildCorpus, discoverSessionFiles, scoreReadRate } from "./readRate.js";
import { loadConfig, runChecks } from "./compliance.js";
import { buildReport, renderHTML, renderJSON, renderTerminal } from "./report.js";

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

program.parseAsync(process.argv);

interface CheckOpts {
  rules: string;
  session: string | undefined;
  cwd: string;
  config: string | undefined;
  format: string;
  out: string | undefined;
  minScore: number | undefined;
  readRate: boolean;
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
    const sessionArg = opts.session ? resolve(opts.session) : undefined;
    const files = await discoverSessionFiles(sessionArg, cwd);
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
  console.log(`\n  ✓ created ${dest}\n  edit it, then run: ruladoctor\n`);
}

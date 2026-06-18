import { readFileSync, existsSync } from "node:fs";
import { resolve, isAbsolute } from "node:path";
import fg from "fast-glob";
import type { Check, ComplianceResult, Config, Rule } from "./types.js";
import { matchesForbiddenCommand } from "./commandMatcher.js";

export const CONFIG_FILES = [".ruledoctor.json", ".ruledoctor.jsonc", "ruledoctor.config.json"];

/** Load sidecar config, or an empty one if none exists. */
export function loadConfig(path: string | undefined, cwd: string): { config: Config; source: string | null } {
  const file = path
    ? resolve(path)
    : CONFIG_FILES.map((c) => resolve(cwd, c)).find((c) => existsSync(c));
  if (!file) return { config: { checks: [], required_reads: [] }, source: null };
  const raw = readFileSync(file, "utf8").replace(/\/\/.*$/gm, ""); // strip JS line comments
  const parsed = JSON.parse(raw) as Partial<Config>;
  return {
    config: {
      checks: Array.isArray(parsed.checks) ? parsed.checks : [],
      required_reads: Array.isArray(parsed.required_reads) ? parsed.required_reads.filter((x) => typeof x === "string") : [],
    },
    source: file,
  };
}

/** Default working-tree scope when a check lists no `paths`. */
const DEFAULT_IGNORE = ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/build/**", "**/.next/**"];

async function scopedFiles(paths: string[] | undefined, cwd: string): Promise<string[]> {
  if (!paths || paths.length === 0) {
    return fg(`${cwd}/**/*`, { ignore: DEFAULT_IGNORE, onlyFiles: true, dot: false });
  }
  const patterns = paths.map((p) => (isAbsolute(p) ? p : resolve(cwd, p)));
  return fg(patterns, { ignore: DEFAULT_IGNORE, onlyFiles: true, dot: false });
}

/**
 * Run every check. Each check is linked to a rule by substring; rules without a
 * matching check simply get `unknown` compliance (reported honestly, not failed).
 */
export async function runChecks(
  rules: Rule[],
  checks: Check[],
  cwd: string,
  corpusText: string,
): Promise<{ results: ComplianceResult[]; orphans: Check[] }> {
  // index rules for fast substring lookup
  const results = new Map<string, ComplianceResult>();
  const orphans: Check[] = [];

  for (const check of checks) {
    const rule = findRule(rules, check.rule);
    if (!rule) {
      orphans.push(check);
      continue;
    }
    // an existing unknown baseline for the rule
    results.set(rule.id, await evaluate(check, rule.id, cwd, corpusText));
  }

  // every other rule -> unknown
  for (const r of rules) {
    if (!results.has(r.id)) {
      results.set(r.id, { ruleId: r.id, status: "unknown", detail: "no checker defined", checkType: null });
    }
  }
  return { results: rules.map((r) => results.get(r.id)!), orphans };
}

function findRule(rules: Rule[], needle: string): Rule | undefined {
  const n = needle.toLowerCase();
  return rules.find((r) => r.text.toLowerCase().includes(n));
}

async function evaluate(check: Check, ruleId: string, cwd: string, corpusText: string): Promise<ComplianceResult> {
  switch (check.type) {
    case "forbid-regex":
      return evalRegex(check, ruleId, cwd, false);
    case "require-regex":
      return evalRegex(check, ruleId, cwd, true);
    case "forbid-command":
      return evalCommand(check, ruleId, corpusText);
    default:
      return { ruleId, status: "unknown", detail: `unknown checker type: ${check.type satisfies never}`, checkType: null };
  }
}

async function evalRegex(check: Check, ruleId: string, cwd: string, requireMode: boolean): Promise<ComplianceResult> {
  if (!check.pattern) {
    return { ruleId, status: "unknown", detail: "checker missing `pattern`", checkType: check.type };
  }
  let re: RegExp;
  try {
    re = new RegExp(check.pattern, "is");
  } catch (e) {
    return { ruleId, status: "unknown", detail: `bad regex: ${(e as Error).message}`, checkType: check.type };
  }
  const files = await scopedFiles(check.paths, cwd);
  let firstHit: { file: string; preview: string } | null = null;
  for (const f of files) {
    let content: string;
    try {
      content = readFileSync(f, "utf8");
    } catch {
      continue;
    }
    const m = re.exec(content);
    if (m) {
      firstHit = { file: f, preview: m[0].slice(0, 60) };
      break;
    }
  }
  const detail = check.message?.trim();

  if (requireMode) {
    return firstHit
      ? { ruleId, status: "pass", detail: detail ?? "required pattern present", checkType: check.type }
      : { ruleId, status: "fail", detail: detail ?? `required pattern "/${check.pattern}/" not found in ${files.length} files`, checkType: check.type };
  }
  // forbid mode
  return firstHit
    ? { ruleId, status: "fail", detail: detail ?? `forbidden pattern found in ${shortPath(firstHit.file, cwd)}: "${firstHit.preview}"`, checkType: check.type }
    : { ruleId, status: "pass", detail: detail ?? `pattern absent across ${files.length} files`, checkType: check.type };
}

function evalCommand(check: Check, ruleId: string, corpusText: string): ComplianceResult {
  if (!check.command) {
    return { ruleId, status: "unknown", detail: "checker missing `command`", checkType: check.type };
  }
  const found = matchesForbiddenCommand(corpusText, check.command);
  const detail = check.message?.trim();
  return found
    ? { ruleId, status: "fail", detail: detail ?? `forbidden command "${check.command}" was run in the session`, checkType: check.type }
    : { ruleId, status: "pass", detail: detail ?? `forbidden command "${check.command}" not seen in session`, checkType: check.type };
}

function shortPath(abs: string, cwd: string): string {
  return abs.startsWith(cwd) ? abs.slice(cwd.length).replace(/^[/\\]/, "") : abs;
}

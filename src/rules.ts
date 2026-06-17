import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import fg from "fast-glob";
import type { Rule } from "./types.js";

/** A parsed rule before it has been assigned a stable id. */
type RuleSeed = { text: string; section: string | null; source: string };

/**
 * Turn a rules file (.cursorrules / CLAUDE.md / AGENTS.md / .mdc) into discrete
 * {@link Rule} statements.
 *
 * Rules files are messy free-form text, so this is deliberately heuristic:
 * markdown list items win; failing that we fall back to sentence splitting.
 * Good enough to give every rule a stable id and clean text — which is all the
 * downstream passes need.
 */
export function parseRulesFile(absPath: string): Rule[] {
  const raw = readFileSync(absPath, "utf8");
  const rules = parseRulesText(raw, absPath);
  return assignIds(rules);
}

export function parseRulesText(raw: string, source: string): RuleSeed[] {
  const lines = raw.split(/\r?\n/);
  const items: { text: string; section: string | null }[] = [];
  let section: string | null = null;
  let hasBullets = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;

    // code fence toggle — skip code blocks wholesale (they're examples, not rules)
    if (/^\s*```/.test(line)) {
      // skip to closing fence
      while (++i < lines.length && !/^\s*```/.test(lines[i])) { /* skip */ }
      continue;
    }

    // markdown heading -> section label
    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      section = heading[2]!.replace(/[*_`]/g, "").trim();
      continue;
    }

    // markdown list item (bulleted or numbered) or task checkbox
    const bullet = trimmed.match(/^(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?(.+)$/);
    if (bullet) {
      hasBullets = true;
      const text = cleanRule(bullet[1]!);
      if (text) items.push({ text, section });
      continue;
    }
  }

  // No structured bullets found -> fall back to splitting free text by sentence.
  if (!hasBullets) {
    return fallbackSentences(raw, source);
  }

  return items.map((it) => ({ text: it.text, section: it.section, source }));
}

/** Collapse whitespace, strip inline code backticks / bold markers, trim. */
function cleanRule(s: string): string {
  let t = s.trim();
  // drop trailing sub-rationale after " — " / "（" if it's just noise? keep it — rationale matters for matching.
  t = t.replace(/`/g, "");
  t = t.replace(/\*\*(.+?)\*\*/g, "$1");
  t = t.replace(/\s+/g, " ").trim();
  // filter out pure links / image-only lines
  if (/^(https?:\/\/\S+|!\[.*]\(.*\))$/i.test(t)) return "";
  if (t.length < 3) return "";
  return t;
}

/** Free-text fallback: split into sentences, drop headings & code. */
function fallbackSentences(raw: string, source: string): RuleSeed[] {
  const cleaned = raw
    .replace(/```[\s\S]*?```/g, " ") // strip fenced code
    .replace(/^\s*#{1,6}\s+.+$/gm, " "); // strip headings
  const sentences = cleaned
    .split(/(?<=[。！？])|(?<=[.!?])\s+|\n+/u)
    .map((s) => cleanRule(s))
    .filter(Boolean);
  return sentences.map((text) => ({ text, section: null, source }));
}

function assignIds(rules: RuleSeed[]): Rule[] {
  // de-dup near-identical text
  const seen = new Set<string>();
  const out: Rule[] = [];
  let n = 0;
  for (const r of rules) {
    const key = r.text.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);
    n++;
    out.push({ id: `R${n}`, text: r.text, section: r.section, source: r.source });
  }
  return out;
}

/** Root-level rule files (common conventions). README is omitted unless listed in required_reads. */
export const ROOT_RULE_CANDIDATES = [
  "CLAUDE.md",
  "AGENTS.md",
  ".cursorrules",
  "CONTRIBUTING.md",
  "GEMINI.md",
  ".windsurfrules",
  "copilot-instructions.md",
  ".github/copilot-instructions.md",
] as const;

export function resolveRequiredReadPaths(cwd: string, relPaths: string[], exists: (p: string) => boolean): string[] {
  const out: string[] = [];
  for (const rel of relPaths) {
    const trimmed = rel.trim();
    if (!trimmed) continue;
    const p = resolve(cwd, trimmed);
    if (exists(p)) out.push(p);
  }
  return out;
}

/**
 * Discover rules files: standard root names + `.cursor/rules/*` + explicit required_reads only.
 */
export function discoverRuleFiles(
  dir: string,
  exists: (p: string) => boolean,
  opts?: { requiredReads?: string[] },
): string[] {
  const cwd = resolve(dir);
  const found = new Set<string>();

  for (const c of ROOT_RULE_CANDIDATES) {
    const p = resolve(cwd, c);
    if (exists(p)) found.add(p);
  }

  const cursorRules = fg.sync(`${cwd}/.cursor/rules/*.{md,mdc}`, { onlyFiles: true, absolute: true });
  for (const p of cursorRules) found.add(p);

  if (opts?.requiredReads?.length) {
    for (const p of resolveRequiredReadPaths(cwd, opts.requiredReads, exists)) found.add(p);
  }

  return [...found].sort();
}

/** Short label for a rules file path, for display. */
export function fileLabel(absPath: string): string {
  return basename(absPath);
}

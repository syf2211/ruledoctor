import { readFileSync } from "node:fs";
import { basename } from "node:path";
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

/**
 * Auto-discover rules files in a directory, in priority order.
 * Returns absolute paths that exist.
 */
export function discoverRuleFiles(dir: string, exists: (p: string) => boolean): string[] {
  const candidates = [
    "CLAUDE.md",
    "AGENTS.md",
    ".cursorrules",
    "GEMINI.md",
    ".windsurfrules",
    "copilot-instructions.md",
  ];
  const found: string[] = [];
  for (const c of candidates) {
    const p = `${dir}/${c}`;
    if (exists(p)) found.push(p);
  }
  return found;
}

/** Short label for a rules file path, for display. */
export function fileLabel(absPath: string): string {
  return basename(absPath);
}

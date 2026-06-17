import { readFileSync } from "node:fs";
import fg from "fast-glob";
import { homedir } from "node:os";
import { isAbsolute, resolve } from "node:path";
import type { ReadRateResult, Rule } from "./types.js";

/**
 * READ-RATE — was a rule's content actually present in the messages sent to the
 * model during a session?
 *
 * We answer this without ever calling the model: we read the agent's own session
 * logs (Claude Code writes one .jsonl per session under ~/.claude/projects/),
 * flatten every message/tool-result into one transcript corpus, and check how
 * much of each rule's distinctive vocabulary appears there. A rule whose tokens
 * are absent almost certainly never reached the model's context for that session
 * (file not loaded, dropped after compaction, wrong path glob, etc.).
 *
 * This is ground truth straight from the wire — free, offline, deterministic.
 */

const READ_THRESHOLD = 0.6;

/** Latin words we never count as "distinctive" (too common in any transcript). */
const STOP = new Set([
  "the", "a", "an", "to", "of", "and", "or", "in", "on", "for", "is", "are",
  "be", "must", "should", "do", "not", "no", "with", "this", "that", "it",
  "if", "then", "as", "by", "at", "use", "using", "all", "any", "new", "you",
  "your", "we", "i", "code", "file", "files", "rule", "rules", "when",
  "from", "into", "than", "but", "so", "can", "will", "has", "have",
]);

interface Token {
  value: string;
  cjk: boolean; // true => match by substring, false => match by word boundary
}

/** Split a rule into the distinctive tokens we'll search the transcript for. */
export function tokenizeRule(text: string): Token[] {
  const tokens: Token[] = [];
  const lower = text.toLowerCase();

  // latin "words" (incl. kebab/snakeCase, paths fragments, dates like yyyy-mm-dd)
  const latinRe = /[a-z][a-z0-9_./-]{1,}/g;
  for (const m of lower.matchAll(latinRe)) {
    const w = m[0].replace(/^[./-]+|[./-]+$/g, "");
    if (w.length < 2) continue;
    if (STOP.has(w)) continue;
    tokens.push({ value: w, cjk: false });
  }

  // CJK runs -> bigrams (single CJK chars are too common to be distinctive)
  const cjkRe = /[一-鿿]{2,}/g;
  for (const run of lower.matchAll(cjkRe)) {
    const s = run[0];
    for (let i = 0; i < s.length - 1; i++) {
      tokens.push({ value: s.slice(i, i + 2), cjk: true });
    }
  }

  // de-dup while preserving that cjk/latin flags differ
  const seen = new Set<string>();
  return tokens.filter((t) => {
    const k = (t.cjk ? "C:" : "L:") + t.value;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Build one big lowercase transcript corpus from session log file(s). */
export function buildCorpus(sessionFiles: string[]): { text: string; lines: number } {
  let text = "";
  let lines = 0;
  for (const file of sessionFiles) {
    let raw: string;
    try {
      raw = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const line of raw.split(/\r?\n/)) {
      if (!line.trim()) continue;
      lines++;
      text += " " + extractText(line);
    }
  }
  return { text: text.toLowerCase(), lines };
}

/** Pull every human/model-readable string out of one JSONL record. */
function extractText(line: string): string {
  let obj: unknown;
  try {
    obj = JSON.parse(line);
  } catch {
    return line; // not JSON — keep raw
  }
  if (typeof obj !== "object" || obj === null) return String(obj);

  const parts: string[] = [];
  const o = obj as Record<string, unknown>;
  const msg = o.message as Record<string, unknown> | undefined;
  const content = msg?.content;
  if (typeof content === "string") {
    parts.push(content);
  } else if (Array.isArray(content)) {
    for (const item of content) {
      if (typeof item === "string") parts.push(item);
      else if (item && typeof item === "object") {
        const it = item as Record<string, unknown>;
        if (typeof it.text === "string") parts.push(it.text);
        if (typeof it.content === "string") parts.push(it.content);
        if (typeof it.name === "string") parts.push(it.name);
      }
    }
  }
  if (typeof o.toolUseResult === "string") parts.push(o.toolUseResult);
  else if (o.toolUseResult) parts.push(safeStringify(o.toolUseResult));
  if (typeof o.summary === "string") parts.push(o.summary);

  // last resort: the whole record carries the ground truth anyway
  if (parts.length === 0) parts.push(safeStringify(o));
  return parts.join(" ");
}

function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/** Score every rule against the corpus. */
export function scoreReadRate(rules: Rule[], corpusText: string): ReadRateResult[] {
  return rules.map((r) => {
    const tokens = tokenizeRule(r.text);
    if (tokens.length === 0) {
      return { ruleId: r.id, confidence: 0, present: false, matched: 0, total: 0 };
    }
    let matched = 0;
    for (const t of tokens) {
      if (tokenInCorpus(t, corpusText)) matched++;
    }
    const confidence = matched / tokens.length;
    return {
      ruleId: r.id,
      confidence,
      present: matched >= 1 && confidence >= READ_THRESHOLD,
      matched,
      total: tokens.length,
    };
  });
}

function tokenInCorpus(t: Token, corpus: string): boolean {
  if (t.cjk) return corpus.includes(t.value);
  // word-boundary match for latin tokens (so "any" != "many")
  const re = new RegExp(`(?<![a-z0-9_])${escapeRe(t.value)}(?![a-z0-9])`, "i");
  return re.test(corpus);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Resolve a --session argument (file | dir | glob) into a list of .jsonl files.
 * With no argument, auto-detect the current project's Claude Code session logs.
 */
export async function discoverSessionFiles(arg: string | undefined, cwd: string): Promise<string[]> {
  if (arg) {
    const base = isAbsolute(arg) ? arg : resolve(cwd, arg);
    // fast-glob handles files, dirs (we append **/*.jsonl), and globs
    const stat = await safeStat(base);
    if (stat === "dir") return fg(`${base}/**/*.jsonl`, { onlyFiles: true });
    if (stat === "file") return [base];
    return fg(base, { onlyFiles: true });
  }

  // default: ~/.claude/projects/<encoded-cwd>/*.jsonl
  const projectsDir = `${homedir()}/.claude/projects`;
  const encoded = cwd.replace(/[\/\\:]+/g, "-").replace(/^-+/, "");
  let files = await fg(`${projectsDir}/${encoded}/*.jsonl`, { onlyFiles: true });
  if (files.length === 0) {
    // fall back to every project log (caller can warn it's broad)
    files = await fg(`${projectsDir}/**/*.jsonl`, { onlyFiles: true });
  }
  return files.sort();
}

async function safeStat(p: string): Promise<"file" | "dir" | null> {
  const { stat } = await import("node:fs/promises");
  try {
    const s = await stat(p);
    return s.isDirectory() ? "dir" : "file";
  } catch {
    return null;
  }
}

import fg from "fast-glob";
import { readFileSync, statSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

export type SessionSource = "claude" | "codex" | "cursor";

export interface SessionFileRef {
  path: string;
  source: SessionSource;
  mtimeMs: number;
}

/** Same encoding Claude Code uses for ~/.claude/projects/<dir> */
export function encodeProjectPath(cwd: string): string {
  return resolve(cwd).replace(/[\/\\:]+/g, "-").replace(/^-+/, "");
}

function codexHome(): string {
  return process.env.CODEX_HOME?.trim() || `${homedir()}/.codex`;
}

/** Read first session_meta.cwd from a Codex rollout jsonl. */
export function readCodexSessionCwd(file: string): string | null {
  try {
    const head = readFileSync(file, "utf8").slice(0, 120_000);
    for (const line of head.split("\n")) {
      if (!line.includes("session_meta")) continue;
      const o = JSON.parse(line) as { type?: string; payload?: { cwd?: string } };
      if (o.type === "session_meta" && o.payload?.cwd) return o.payload.cwd;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function listCodexSessionsForCwd(cwd: string): SessionFileRef[] {
  const abs = resolve(cwd);
  const dir = `${codexHome()}/sessions`;
  if (!existsSync(dir)) return [];
  const files = fg.sync(`${dir}/**/*.jsonl`, { onlyFiles: true }) as string[];
  const out: SessionFileRef[] = [];
  for (const f of files) {
    const sessionCwd = readCodexSessionCwd(f);
    if (sessionCwd && resolve(sessionCwd) !== abs) continue;
    if (!sessionCwd) continue;
    out.push({ path: f, source: "codex", mtimeMs: statSync(f).mtimeMs });
  }
  return out;
}

function listClaudeSessionsForCwd(cwd: string): SessionFileRef[] {
  const projectsDir = `${homedir()}/.claude/projects`;
  const encoded = encodeProjectPath(cwd);
  const files = fg.sync(`${projectsDir}/${encoded}/*.jsonl`, { onlyFiles: true }) as string[];
  return files.map((f) => ({ path: f, source: "claude" as const, mtimeMs: statSync(f).mtimeMs }));
}

function listCursorSessionsForCwd(cwd: string): SessionFileRef[] {
  const projectsDir = `${homedir()}/.cursor/projects`;
  if (!existsSync(projectsDir)) return [];
  const abs = resolve(cwd);
  const encoded = encodeProjectPath(cwd);
  const candidates = new Set<string>();

  // Direct folder match (Cursor often uses encoded absolute path)
  candidates.add(`${projectsDir}/${encoded}/**/*.jsonl`);

  // Parent workspace (e.g. open Desktop/RuleDoctor while cwd is .../rule-doctor)
  let parent = abs;
  for (let i = 0; i < 3; i++) {
    parent = resolve(parent, "..");
    candidates.add(`${projectsDir}/${encodeProjectPath(parent)}/**/*.jsonl`);
  }

  const files = new Set<string>();
  for (const pattern of candidates) {
    for (const f of fg.sync(pattern, { onlyFiles: true }) as string[]) files.add(f);
  }

  // Folder name may not match cwd (e.g. workspace slug vs 工作区 path) — scan by path in transcript
  if (files.size === 0) {
    const all = fg.sync(`${projectsDir}/**/*.jsonl`, { onlyFiles: true }) as string[];
    for (const f of all) {
      if (cursorTranscriptMentionsCwd(f, abs)) files.add(f);
    }
  } else {
    // Also include transcripts that mention this cwd under other project slugs
    const all = fg.sync(`${projectsDir}/**/*.jsonl`, { onlyFiles: true }) as string[];
    for (const f of all) {
      if (!files.has(f) && cursorTranscriptMentionsCwd(f, abs)) files.add(f);
    }
  }

  return [...files].map((f) => ({ path: f, source: "cursor" as const, mtimeMs: statSync(f).mtimeMs }));
}

function cursorTranscriptMentionsCwd(file: string, cwd: string): boolean {
  const abs = resolve(cwd);
  const needle = abs.replace(/\\/g, "/");
  try {
    const chunk = readFileSync(file, "utf8").slice(0, 250_000);
    if (chunk.includes(needle)) return true;
    // common: agent runs with cwd in tool paths
    const base = needle.replace(/\/$/, "");
    return chunk.includes(`"${base}/`) || chunk.includes(`'${base}/`);
  } catch {
    return false;
  }
}

/** All session logs for this project directory across Claude / Codex / Cursor. */
export function listSessionsForProject(cwd: string): SessionFileRef[] {
  const all = [
    ...listClaudeSessionsForCwd(cwd),
    ...listCodexSessionsForCwd(cwd),
    ...listCursorSessionsForCwd(cwd),
  ];
  all.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return all;
}

export function findLatestSessionForProject(cwd: string): SessionFileRef | null {
  const list = listSessionsForProject(cwd);
  return list[0] ?? null;
}

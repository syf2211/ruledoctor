/**
 * RuleDoctor / 规则体检 — core types
 *
 * The model: AI coding assistants are given "rules" (in .cursorrules / CLAUDE.md /
 * AGENTS.md). Two honest questions, both currently unanswerable by any tool:
 *
 *   1. READ-RATE  — was this rule's content actually present in the messages
 *                   sent to the model during a given session? (We answer this
 *                   from the agent's own session logs — ground truth, free.)
 *   2. COMPLIANCE — when the model did its work, did the result actually obey
 *                   the rule? (We answer this with deterministic checkers over
 *                   the working tree / recent diff / session transcript.)
 *
 * Everything below is the shared data these two passes produce and the report
 * consumes.
 */

/** A single rule statement parsed out of a rules file. */
export interface Rule {
  /** Stable id, e.g. "R3". */
  id: string;
  /** Human-readable rule text, trimmed/cleaned. */
  text: string;
  /** Section / heading the rule lived under, if any. */
  section: string | null;
  /** Absolute path of the file the rule came from. */
  source: string;
}

/** Read-rate result for one rule, derived from session logs. */
export interface ReadRateResult {
  ruleId: string;
  /** 0..1 — fraction of the rule's distinctive tokens found in the transcript. */
  confidence: number;
  /** Resolved boolean: confidence >= threshold. */
  present: boolean;
  /** How many distinctive tokens matched / total. */
  matched: number;
  total: number;
}

/** The kind of deterministic compliance checker a rule can have. */
export type CheckerType =
  | "forbid-regex" // pattern must NOT appear in the matched files
  | "require-regex" // pattern MUST appear somewhere in the matched files
  | "forbid-command"; // a shell command pattern must NOT have been run in the session

/** A user-defined check, linked to a rule by substring match. */
export interface Check {
  /** Substring used to link this check to a parsed rule. */
  rule: string;
  type: CheckerType;
  /** Regex source (for *-regex types). */
  pattern?: string;
  /** Glob patterns of files to scan (for *-regex types). Defaults to all. */
  paths?: string[];
  /** Shell command substring to forbid (for forbid-command). */
  command?: string;
  message?: string;
}

/** Sidecar config (.ruledoctor.json). */
export interface Config {
  checks: Check[];
  /**
   * Project-relative paths the agent must Read (explicit list — no whole-repo scan).
   * Example: ["docs/agent_workflow_protocol.md", "CONTRIBUTING.md"]
   */
  required_reads?: string[];
}

export type Status = "pass" | "fail" | "unknown";

/** Compliance result for one rule. */
export interface ComplianceResult {
  ruleId: string;
  status: Status;
  /** Human-readable detail (what was found / why it failed). */
  detail: string;
  /** The checker that produced this, if any. */
  checkType: CheckerType | null;
}

/** A row in the final report — one rule, read-rate + compliance joined. */
export interface ReportRow {
  rule: Rule;
  read: ReadRateResult;
  compliance: ComplianceResult;
}

/** The fully assembled report. */
export interface Report {
  score: number; // 0..100
  readRatePct: number; // 0..100, share of rules present in context
  compliancePct: number | null; // null when no checkers configured
  totalRules: number;
  presentRules: number;
  checkedRules: number;
  passedChecks: number;
  rows: ReportRow[];
  /** Free-form notes surfaced to the user (e.g. session files scanned). */
  notes: string[];
  /** False when no .ruledoctor.json checks — score is read-rate only. */
  complianceConfigured: boolean;
}

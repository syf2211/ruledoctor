import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync, existsSync, mkdirSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { parseRulesFile, parseRuleFiles, parseRulesText, discoverRuleFiles } from "../src/rules.js";

test("parses bulleted rules and tracks the section heading", () => {
  const raw = "# 规则\n\n## 硬性\n- 金额用整数\n- 日期用 YYYY-MM-DD\n";
  const rules = parseRulesText(raw, "t");
  assert.equal(rules.length, 2);
  assert.equal(rules[0].text, "金额用整数");
  assert.equal(rules[0].section, "硬性");
});

test("falls back to sentence splitting when there are no bullets", () => {
  const rules = parseRulesText("使用整数分。日期用横杠。", "t");
  assert.ok(rules.length >= 2);
  assert.ok(rules.some((r) => r.text.includes("整数")));
});

test("parseRulesFile assigns stable ids and de-duplicates", () => {
  const d = mkdtempSync(join(tmpdir(), "rd-"));
  try {
    writeFileSync(join(d, "CLAUDE.md"), "- 金额用整数\n- 金额用整数\n- 日期横杠\n");
    const rules = parseRulesFile(join(d, "CLAUDE.md"));
    assert.equal(rules.length, 2);
    assert.equal(rules[0].id, "R1");
    assert.equal(rules[1].id, "R2");
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test("parseRuleFiles assigns unique ids across multiple files", () => {
  const d = mkdtempSync(join(tmpdir(), "rd-"));
  try {
    writeFileSync(join(d, "CLAUDE.md"), "- alpha unique one\n");
    writeFileSync(join(d, "AGENTS.md"), "- beta unique two\n");
    const rules = parseRuleFiles([join(d, "CLAUDE.md"), join(d, "AGENTS.md")]);
    assert.deepEqual(rules.map((r) => r.id), ["R1", "R2"]);
    assert.equal(new Set(rules.map((r) => r.id)).size, rules.length);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test("discovers standard rule files that exist", () => {
  const d = mkdtempSync(join(tmpdir(), "rd-"));
  try {
    writeFileSync(join(d, "CLAUDE.md"), "- a\n");
    writeFileSync(join(d, ".cursorrules"), "- b\n");
    writeFileSync(join(d, "CONTRIBUTING.md"), "- c\n");
    const files = discoverRuleFiles(d, existsSync);
    assert.ok(files.some((f) => f.endsWith("CLAUDE.md")));
    assert.ok(files.some((f) => f.endsWith("CONTRIBUTING.md")));
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test("required_reads adds explicit paths only", () => {
  const d = mkdtempSync(join(tmpdir(), "rd-"));
  try {
    writeFileSync(join(d, "CLAUDE.md"), "- a\n");
    mkdirSync(join(d, "docs"), { recursive: true });
    writeFileSync(join(d, "docs", "proto.md"), "- deep\n");
    const files = discoverRuleFiles(d, existsSync, { requiredReads: ["docs/proto.md", "missing.md"] });
    assert.ok(files.some((f) => f.endsWith("docs/proto.md")));
    assert.ok(!files.some((f) => f.endsWith("missing.md")));
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test("required_reads rejects project escapes and symlink escapes", () => {
  const root = mkdtempSync(join(tmpdir(), "rd-root-"));
  const outside = mkdtempSync(join(tmpdir(), "rd-outside-"));
  try {
    mkdirSync(join(root, "docs"), { recursive: true });
    writeFileSync(join(root, "CLAUDE.md"), "- root rule\n");
    writeFileSync(join(root, "docs", "inside.md"), "- inside\n");
    writeFileSync(join(outside, "secret.md"), "- secret\n");
    symlinkSync(join(outside, "secret.md"), join(root, "docs", "secret-link.md"));

    const escapePath = relative(root, join(outside, "secret.md"));
    const files = discoverRuleFiles(root, existsSync, {
      requiredReads: ["docs/inside.md", "docs/secret-link.md", escapePath, "/etc/passwd"],
    });

    assert.ok(files.some((f) => f.endsWith("docs/inside.md")));
    assert.ok(!files.some((f) => f.includes("secret")));
    assert.ok(!files.some((f) => f === "/etc/passwd"));
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

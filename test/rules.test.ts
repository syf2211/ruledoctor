import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseRulesFile, parseRulesText, discoverRuleFiles } from "../src/rules.js";

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

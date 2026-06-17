import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReport, lampOf } from "../src/report.js";
import type { ReportRow, Rule } from "../src/types.js";

function rule(i: number, text: string): Rule {
  return { id: "R" + i, text, section: null, source: "t" };
}
function row(
  i: number,
  present: boolean,
  confidence: number,
  status: ReportRow["compliance"]["status"],
): ReportRow {
  return {
    rule: rule(i, "rule " + i),
    read: { ruleId: "R" + i, confidence, present, matched: present ? 1 : 0, total: 1 },
    compliance: { ruleId: "R" + i, status, detail: "", checkType: null },
  };
}

test("score blends 40% read-rate + 60% compliance", () => {
  const rules = [rule(1, "a"), rule(2, "b")];
  const read = [
    { ruleId: "R1", confidence: 1, present: true, matched: 1, total: 1 },
    { ruleId: "R2", confidence: 0, present: false, matched: 0, total: 1 },
  ];
  const comp = [
    { ruleId: "R1", status: "pass" as const, detail: "", checkType: null },
    { ruleId: "R2", status: "fail" as const, detail: "", checkType: null },
  ];
  const rep = buildReport(rules, read, comp, []);
  assert.equal(rep.readRatePct, 50);
  assert.equal(rep.compliancePct, 50);
  assert.equal(rep.score, 50);
});

test("no checks => read-rate only score, compliance not configured", () => {
  const rules = [rule(1, "a"), rule(2, "b")];
  const read = [
    { ruleId: "R1", confidence: 1, present: true, matched: 1, total: 1 },
    { ruleId: "R2", confidence: 0, present: false, matched: 0, total: 1 },
  ];
  const comp = rules.map((r) => ({ ruleId: r.id, status: "unknown" as const, detail: "", checkType: null }));
  const rep = buildReport(rules, read, comp, []);
  assert.equal(rep.complianceConfigured, false);
  assert.equal(rep.compliancePct, null);
  assert.equal(rep.score, 50);
});

test("lampOf mapping", () => {
  assert.equal(lampOf(row(1, true, 1, "pass")), "g");
  assert.equal(lampOf(row(2, true, 1, "unknown")), "y");
  assert.equal(lampOf(row(3, true, 1, "fail")), "r");
  assert.equal(lampOf(row(4, false, 0, "unknown")), "r");
});

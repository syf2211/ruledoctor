import { test } from "node:test";
import assert from "node:assert/strict";
import { tokenizeRule, scoreReadRate } from "../src/readRate.js";
import type { Rule } from "../src/types.js";

test("tokenizeRule extracts CJK bigrams", () => {
  const t = tokenizeRule("金额必须用整数");
  assert.ok(t.some((x) => x.value === "金额" && x.cjk));
  assert.ok(t.some((x) => x.value === "整数" && x.cjk));
});

test("tokenizeRule extracts latin words (word-boundary matched)", () => {
  const t = tokenizeRule("run npm run lint");
  assert.ok(t.some((x) => x.value === "lint" && !x.cjk));
});

test("a rule whose text is in the transcript is present", () => {
  const rules: Rule[] = [{ id: "R1", text: "金额必须用整数", section: null, source: "t" }];
  const [r] = scoreReadRate(rules, "金额必须用整数分");
  assert.equal(r.present, true);
  assert.ok(r.confidence >= 0.6);
});

test("a rule whose distinctive tokens are absent is not present", () => {
  const rules: Rule[] = [{ id: "R1", text: "严禁使用 any 类型", section: null, source: "t" }];
  const [r] = scoreReadRate(rules, "金额必须用整数分");
  assert.equal(r.present, false);
});

test("latin token matches on word boundary (any != many)", () => {
  const rules: Rule[] = [{ id: "R1", text: "禁止 any 标识符", section: null, source: "t" }];
  // "many" contains "any" as a substring but should NOT match a word-boundary token
  const [r] = scoreReadRate(rules, "there are many records here");
  assert.equal(r.present, false);
});

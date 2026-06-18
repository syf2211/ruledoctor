import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { runChecks } from "../src/compliance.js";
import type { Check, Rule } from "../src/types.js";

const fixtures = resolve(fileURLToPath(new URL(".", import.meta.url)), "fixtures");

const rules: Rule[] = [
  { id: "R1", text: "金额用整数「分」", section: null, source: "t" },
  { id: "R2", text: "错误用 ErrorXxx", section: null, source: "t" },
  { id: "R3", text: "禁止 any 类型", section: null, source: "t" },
];

test("forbid-regex fails when the pattern is present", async () => {
  const checks: Check[] = [{ rule: "整数「分」", type: "forbid-regex", pattern: "\\d+\\.\\d+", paths: ["src/**"] }];
  const { results } = await runChecks(rules, checks, fixtures, "");
  assert.equal(results.find((r) => r.ruleId === "R1")!.status, "fail");
});

test("forbid-regex passes when the pattern is absent", async () => {
  const checks: Check[] = [{ rule: "ErrorXxx", type: "forbid-regex", pattern: "ZZZ_NOT_PRESENT", paths: ["src/**"] }];
  const { results } = await runChecks(rules, checks, fixtures, "");
  assert.equal(results.find((r) => r.ruleId === "R2")!.status, "pass");
});

test("require-regex fails when the pattern is missing", async () => {
  const checks: Check[] = [{ rule: "ErrorXxx", type: "require-regex", pattern: "ZZZ_NOT_PRESENT", paths: ["src/**"] }];
  const { results } = await runChecks(rules, checks, fixtures, "");
  assert.equal(results.find((r) => r.ruleId === "R2")!.status, "fail");
});

test("require-regex passes when present", async () => {
  const checks: Check[] = [{ rule: "ErrorXxx", type: "require-regex", pattern: "ErrorXxx", paths: ["src/**"] }];
  const { results } = await runChecks(rules, checks, fixtures, "");
  assert.equal(results.find((r) => r.ruleId === "R2")!.status, "pass");
});

test("forbid-command fails when the command was run", async () => {
  const checks: Check[] = [{ rule: "any 类型", type: "forbid-command", command: "rm -rf" }];
  const { results } = await runChecks(rules, checks, fixtures, "i ran rm -rf /tmp");
  assert.equal(results.find((r) => r.ruleId === "R3")!.status, "fail");
});

test("forbid-command detects force flag after refspec", async () => {
  const checks: Check[] = [{ rule: "any 类型", type: "forbid-command", command: "push --force" }];
  const { results } = await runChecks(rules, checks, fixtures, "tool command: git push origin main --force");
  assert.equal(results.find((r) => r.ruleId === "R3")!.status, "fail");
});

test("forbid-command passes when the command was not run", async () => {
  const checks: Check[] = [{ rule: "any 类型", type: "forbid-command", command: "rm -rf" }];
  const { results } = await runChecks(rules, checks, fixtures, "nothing dangerous here");
  assert.equal(results.find((r) => r.ruleId === "R3")!.status, "pass");
});

test("rules without a matching check are unknown", async () => {
  const { results } = await runChecks(rules, [], fixtures, "");
  assert.ok(results.every((r) => r.status === "unknown"));
});

test("checks that match no rule become orphans", async () => {
  const checks: Check[] = [{ rule: "不存在的规则XYZ", type: "forbid-regex", pattern: "x", paths: ["src/**"] }];
  const { orphans } = await runChecks(rules, checks, fixtures, "");
  assert.equal(orphans.length, 1);
});

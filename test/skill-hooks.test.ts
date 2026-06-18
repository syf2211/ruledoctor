import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RULE_GUARD = join(REPO_ROOT, "scripts", "rule-guard.mjs");
const REINJECT = join(REPO_ROOT, "scripts", "reinject-rules.mjs");

function runHook(script: string, payload: Record<string, unknown>) {
  return spawnSync(process.execPath, [script], {
    input: JSON.stringify(payload),
    encoding: "utf8",
    maxBuffer: 2 * 1024 * 1024,
  });
}

test("rule-guard denies git push --force when forbid-command configured", () => {
  const dir = mkdtempSync(join(tmpdir(), "rd-guard-"));
  writeFileSync(
    join(dir, ".ruledoctor.json"),
    JSON.stringify({
      checks: [{ type: "forbid-command", command: "push --force", message: "禁止 force push" }],
    }),
  );
  const r = runHook(RULE_GUARD, {
    cwd: dir,
    command: "git push --force origin main",
    hook_event_name: "PreToolUse",
    tool_name: "Bash",
  });
  rmSync(dir, { recursive: true, force: true });

  assert.equal(r.status, 2);
  const out = JSON.parse(r.stdout.trim());
  assert.equal(out.hookSpecificOutput.permissionDecision, "deny");
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /force push|禁止/);
});

test("rule-guard denies force push when flag appears after refspec", () => {
  const dir = mkdtempSync(join(tmpdir(), "rd-guard-"));
  const r = runHook(RULE_GUARD, {
    cwd: dir,
    command: "git push origin main --force",
    hook_event_name: "PreToolUse",
    tool_name: "Bash",
  });
  rmSync(dir, { recursive: true, force: true });

  assert.equal(r.status, 2);
  const out = JSON.parse(r.stdout.trim());
  assert.equal(out.hookSpecificOutput.permissionDecision, "deny");
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /force/);
});

test("rule-guard denies force-with-lease", () => {
  const dir = mkdtempSync(join(tmpdir(), "rd-guard-"));
  const r = runHook(RULE_GUARD, {
    cwd: dir,
    command: "git -C repo push origin main --force-with-lease",
    hook_event_name: "PreToolUse",
    tool_name: "Bash",
  });
  rmSync(dir, { recursive: true, force: true });

  assert.equal(r.status, 2);
});

test("rule-guard allows safe commands", () => {
  const dir = mkdtempSync(join(tmpdir(), "rd-guard-"));
  writeFileSync(
    join(dir, ".ruledoctor.json"),
    JSON.stringify({
      checks: [{ type: "forbid-command", command: "push --force", message: "禁止 force push" }],
    }),
  );
  const r = runHook(RULE_GUARD, {
    cwd: dir,
    command: "git push origin main",
    hook_event_name: "PreToolUse",
  });
  rmSync(dir, { recursive: true, force: true });

  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), "");
});

test("reinject-rules includes CLAUDE.md body in additionalContext", () => {
  const dir = mkdtempSync(join(tmpdir(), "rd-reinject-"));
  const marker = "UNIQUE_RULE_MARKER_7f3a9c";
  writeFileSync(join(dir, "CLAUDE.md"), `# Rules\n\n- ${marker}\n`);
  const r = runHook(REINJECT, {
    cwd: dir,
    hook_event_name: "PreCompact",
  });
  rmSync(dir, { recursive: true, force: true });

  assert.equal(r.status, 0);
  const out = JSON.parse(r.stdout.trim());
  const ctx = out.hookSpecificOutput.additionalContext as string;
  assert.ok(typeof ctx === "string" && ctx.length > 0);
  assert.match(ctx, /CLAUDE\.md/);
  assert.match(ctx, new RegExp(marker));
});

test("reinject-rules ignores required_reads outside the project", () => {
  const dir = mkdtempSync(join(tmpdir(), "rd-reinject-"));
  const outside = mkdtempSync(join(tmpdir(), "rd-reinject-out-"));
  try {
    mkdirSync(join(dir, "docs"), { recursive: true });
    writeFileSync(join(dir, "CLAUDE.md"), "# Rules\n\n- ROOT_RULE_MARKER\n");
    writeFileSync(join(dir, "docs", "inside.md"), "- INSIDE_REQUIRED_MARKER\n");
    writeFileSync(join(outside, "secret.md"), "- SECRET_REQUIRED_MARKER\n");
    writeFileSync(
      join(dir, ".ruledoctor.json"),
      JSON.stringify({ required_reads: ["docs/inside.md", relative(dir, join(outside, "secret.md")), "/etc/passwd"] }),
    );

    const r = runHook(REINJECT, {
      cwd: dir,
      hook_event_name: "PreCompact",
    });
    assert.equal(r.status, 0);
    const out = JSON.parse(r.stdout.trim());
    const ctx = out.hookSpecificOutput.additionalContext as string;
    assert.match(ctx, /INSIDE_REQUIRED_MARKER/);
    assert.doesNotMatch(ctx, /SECRET_REQUIRED_MARKER/);
    assert.doesNotMatch(ctx, /root:/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const skillDir = join(root, "skills", "ruledoctor");
const skillMd = join(skillDir, "SKILL.md");
const pluginSkillMd = join(root, "plugin", "skills", "ruledoctor", "SKILL.md");
const openaiYaml = join(skillDir, "agents", "openai.yaml");
const deprecatedAlias = join(root, "skills", "install-ruledoctor", "SKILL.md");
const skillReadme = join(skillDir, "README.md");

const errors = [];

function fail(message) {
  errors.push(message);
}

function read(path) {
  return readFileSync(path, "utf8");
}

if (!existsSync(skillMd)) {
  fail("skills/ruledoctor/SKILL.md is missing");
} else {
  const content = read(skillMd);
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    fail("SKILL.md is missing YAML frontmatter");
  } else {
    const fm = match[1];
    const name = fm.match(/^name:\s*(.+)$/m)?.[1]?.trim();
    const descBlock = fm.match(/^description:\s*>-\n([\s\S]*)/m)?.[1] ?? "";
    const description = descBlock
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => line.trim())
      .join(" ");
    if (name !== "ruledoctor") fail(`unexpected skill name: ${name ?? "(missing)"}`);
    if (!description) fail("description is missing");
    if (description.length > 1024) fail(`description is too long: ${description.length}`);
    if (/[<>]/.test(description)) fail("description must not contain angle brackets");
    for (const term of ["AGENTS.md", "required_reads", "git push", "compacted"]) {
      if (!description.includes(term)) fail(`description should mention ${term}`);
    }
  }
  if (!content.includes("忽略绝对路径、`..` 逃逸和指向项目外的 symlink")) {
    fail("SKILL.md must document required_reads project-boundary behavior");
  }
}

if (!existsSync(openaiYaml)) {
  fail("skills/ruledoctor/agents/openai.yaml is missing");
} else {
  const yaml = read(openaiYaml);
  if (!yaml.includes('display_name: "RuleDoctor"')) fail("openai.yaml missing display_name");
  if (!yaml.includes("$ruledoctor")) fail("openai.yaml default_prompt must mention $ruledoctor");
}

if (existsSync(deprecatedAlias)) {
  fail("deprecated skills/install-ruledoctor/SKILL.md must not be rediscoverable");
}

if (existsSync(skillReadme)) {
  fail("skills/ruledoctor/README.md should not be bundled in the Skill folder; keep human docs in the repo README/docs");
}

if (existsSync(pluginSkillMd) && existsSync(skillMd) && read(pluginSkillMd) !== read(skillMd)) {
  fail("plugin/skills/ruledoctor/SKILL.md is not synced with skills/ruledoctor/SKILL.md");
}

if (errors.length) {
  console.error("\nRuleDoctor skill validation failed:\n");
  for (const e of errors) console.error(`- ${e}`);
  console.error("");
  process.exit(1);
}

console.log("RuleDoctor skill validation passed");

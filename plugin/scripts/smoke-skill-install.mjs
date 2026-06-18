#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const home = mkdtempSync(join(tmpdir(), "ruledoctor-skill-install-"));

try {
  const result = spawnSync(
    "npx",
    [
      "--yes",
      "skills@1.5.11",
      "add",
      root,
      "-g",
      "-a",
      "codex",
      "-s",
      "ruledoctor",
      "-y",
      "--full-depth",
    ],
    {
      cwd: root,
      encoding: "utf8",
      timeout: 120_000,
      env: {
        ...process.env,
        HOME: home,
        XDG_CONFIG_HOME: join(home, ".config"),
        NO_UPDATE_NOTIFIER: "1",
      },
    },
  );

  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (result.status !== 0) {
    console.error(output);
    throw new Error(`skills installer exited with ${result.status}`);
  }
  if (/Failed to install|PromptScript does not support global skill installation/i.test(output)) {
    console.error(output);
    throw new Error("skills installer reported a partial install failure");
  }

  const installed = join(home, ".agents", "skills", "ruledoctor");
  const skillMd = join(installed, "SKILL.md");
  const openaiYaml = join(installed, "agents", "openai.yaml");
  if (!existsSync(skillMd)) throw new Error(`missing installed ${skillMd}`);
  if (!existsSync(openaiYaml)) throw new Error(`missing installed ${openaiYaml}`);

  console.log("RuleDoctor skill install smoke passed");
} finally {
  rmSync(home, { recursive: true, force: true });
}

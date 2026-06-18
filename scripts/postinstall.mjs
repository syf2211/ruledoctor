#!/usr/bin/env node
/** Optional hook bootstrap. Set RULEDOCTOR_BOOTSTRAP_HOOKS=1 to opt in. */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

if (process.env.RULEDOCTOR_BOOTSTRAP_HOOKS !== "1") process.exit(0);

const bootstrap = join(dirname(fileURLToPath(import.meta.url)), "bootstrap.mjs");
spawnSync(process.execPath, [bootstrap], { stdio: "inherit" });

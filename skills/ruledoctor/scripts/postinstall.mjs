#!/usr/bin/env node
/** Global npm install: wire user-level hooks once (skip with RULEDOCTOR_SKIP_BOOTSTRAP=1). */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

if (process.env.RULEDOCTOR_SKIP_BOOTSTRAP === "1") process.exit(0);
if (!process.env.npm_config_global && !process.env.RULEDOCTOR_FORCE_BOOTSTRAP) process.exit(0);

const bootstrap = join(dirname(fileURLToPath(import.meta.url)), "bootstrap.mjs");
spawnSync(process.execPath, [bootstrap], { stdio: "inherit" });

#!/usr/bin/env node
/**
 * One-click runner for the e2e suite.
 *
 *   node scripts/e2e.js [run|open] [environment] [tags]
 *   node scripts/e2e.js                      -> run all features on staging
 *   node scripts/e2e.js run local "@smoke"   -> smoke on local
 *   node scripts/e2e.js open staging         -> interactive runner
 *
 * It removes ELECTRON_RUN_AS_NODE (set by VS Code terminals; it makes Cypress fail with
 * "bad option: --smoke-test"), so it works from any terminal, task or button.
 */
const { spawn } = require("child_process");
const { existsSync } = require("fs");
const { join } = require("path");

const [mode = "run", environment = "staging", tags] = process.argv.slice(2);

if (!["run", "open"].includes(mode)) {
  console.error(`Unknown mode "${mode}" (expected run | open)`);
  process.exit(2);
}
if (!existsSync(join(__dirname, "..", "config", `${environment}.json`))) {
  console.error(`Unknown environment "${environment}": config/${environment}.json not found`);
  process.exit(2);
}

const args = ["cypress", mode, ...(mode === "open" ? ["--e2e"] : []), "--env", `environment=${environment}`];
if (tags) args.push("--expose", `tags=${tags}`);

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

console.log(`> npx ${args.join(" ")}`);
const child = spawn("npx", args, { stdio: "inherit", env, shell: process.platform === "win32" });
child.on("exit", (code) => process.exit(code ?? 1));

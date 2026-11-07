import { defineConfig } from "cypress";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { addCucumberPreprocessorPlugin } from "@badeball/cypress-cucumber-preprocessor";
import { createEsbuildPlugin } from "@badeball/cypress-cucumber-preprocessor/esbuild";
import createBundler from "@bahmutov/cypress-esbuild-preprocessor";

interface EnvConfig {
  baseUrl: string;
  apiUrl: string;
  defaultCommandTimeout?: number;
  pageLoadTimeout?: number;
  requestTimeout?: number;
  responseTimeout?: number;
  flags?: Record<string, unknown>;
}

const ENVIRONMENTS = ["local", "project", "dev3", "staging"];

function loadEnvConfig(name: string): EnvConfig {
  const file = join(__dirname, "config", `${name}.json`);
  if (!ENVIRONMENTS.includes(name) || !existsSync(file)) {
    throw new Error(`Unknown environment "${name}" (expected ${ENVIRONMENTS.join(" | ")})`);
  }
  const cfg = JSON.parse(readFileSync(file, "utf-8")) as EnvConfig;
  for (const key of ["baseUrl", "apiUrl"] as const) {
    if (!cfg[key] || cfg[key].includes("CHANGE-ME")) {
      throw new Error(`config/${name}.json: set a real "${key}" (current: "${cfg[key] ?? ""}")`);
    }
  }
  return cfg;
}

export default defineConfig({
  video: false,
  screenshotOnRunFailure: true,
  viewportWidth: 1920,
  viewportHeight: 1080,
  retries: { runMode: 1, openMode: 0 },
  e2e: {
    specPattern: "cypress/e2e/features/**/*.feature",
    // Adds "Run all specs" (and "Run N specs" per folder) to the Specs list in `cypress open`.
    experimentalRunAllSpecs: true,
    supportFile: "cypress/support/e2e.ts",
    async setupNodeEvents(on, config) {
      // `--env environment=local|project` (node side); defaults to local.
      const environment = String(config.env.environment ?? "local");
      const env = loadEnvConfig(environment);
      const { apiUrl, flags } = env;

      config.baseUrl = env.baseUrl;
      config.defaultCommandTimeout = env.defaultCommandTimeout ?? config.defaultCommandTimeout;
      config.pageLoadTimeout = env.pageLoadTimeout ?? config.pageLoadTimeout;
      config.requestTimeout = env.requestTimeout ?? config.requestTimeout;
      config.responseTimeout = env.responseTimeout ?? config.responseTimeout;
      // Non-secret values readable in the browser via Cypress.expose().
      // CLI `--expose` (e.g. tags=@smoke) is applied last so it always wins.
      config.expose = { environment, apiUrl, ...flags, ...config.expose };

      await addCucumberPreprocessorPlugin(on, config);
      on("file:preprocessor", createBundler({ plugins: [createEsbuildPlugin(config)] }));

      return config;
    },
  },
});

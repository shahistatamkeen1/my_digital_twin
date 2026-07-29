import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const nextConfigs = [...nextVitals, ...nextTs];

function warningBaseline(configs) {
  const rules = {};

  for (const config of configs) {
    for (const [ruleName, setting] of Object.entries(config.rules ?? {})) {
      if (setting === "off" || setting === 0) {
        rules[ruleName] = "off";
        continue;
      }

      rules[ruleName] = Array.isArray(setting)
        ? ["warn", ...setting.slice(1)]
        : "warn";
    }
  }

  return rules;
}

const eslintConfig = defineConfig([
  ...nextConfigs,
  {
    name: "phase5a-legacy-warning-baseline",
    // The application predates the stricter React 19/Next.js lint rules.
    // Keep lint findings visible while TypeScript and production builds remain
    // blocking quality gates. `npm run lint:strict` is available for the
    // follow-up cleanup phase and fails on every remaining warning.
    rules: warningBaseline(nextConfigs),
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

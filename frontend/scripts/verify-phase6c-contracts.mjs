import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(currentDir, "..");
const projectRoot = resolve(frontendRoot, "..");

const requiredFiles = [
  "app/digital-twin-advisor/page.tsx",
  "lib/agent-runs.ts",
  "types/agent-runs.ts",
  "components/orchestration/AgentGoalComposer.tsx",
  "components/orchestration/AgentRunHistory.tsx",
  "components/orchestration/AgentRunProgress.tsx",
  "components/orchestration/AgentRunResult.tsx",
  "components/orchestration/AgentRunTelemetry.tsx",
];

for (const relativePath of requiredFiles) {
  const absolutePath = resolve(frontendRoot, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Phase 6C file is missing: ${relativePath}`);
  }
}

const version = readFileSync(resolve(projectRoot, "VERSION"), "utf8").trim();
if (version !== "0.6.2") {
  throw new Error(`Expected VERSION 0.6.2, received ${version || "<empty>"}.`);
}

const apiClient = readFileSync(resolve(frontendRoot, "lib/agent-runs.ts"), "utf8");
const requiredEndpoints = [
  "/api/agents/",
  "/api/agent-runs/",
  "/execute",
  "/cancel",
  "/retry",
];

for (const endpoint of requiredEndpoints) {
  if (!apiClient.includes(endpoint)) {
    throw new Error(`Phase 6C API client is missing endpoint: ${endpoint}`);
  }
}

const workspace = readFileSync(
  resolve(frontendRoot, "app/digital-twin-advisor/page.tsx"),
  "utf8"
);
const requiredWorkspaceFeatures = [
  "createAgentRun",
  "executeAgentRun",
  "cancelAgentRun",
  "retryAgentRun",
  "deleteAgentRun",
  "AgentRunHistory",
  "AgentRunProgress",
  "AgentRunResult",
  "AgentRunTelemetry",
];

for (const feature of requiredWorkspaceFeatures) {
  if (!workspace.includes(feature)) {
    throw new Error(`Phase 6C workspace is missing feature: ${feature}`);
  }
}

console.log("Phase 6C frontend contract verification passed.");
console.log("Agent planning, execution, cancellation, retry, deletion, history, results, and telemetry are wired.");

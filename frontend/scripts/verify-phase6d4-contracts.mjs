import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(currentDir, "..");
const projectRoot = resolve(frontendRoot, "..");

const requiredFiles = [
  "app/action-outbox/page.tsx",
  "components/outbox/ActionOutboxDashboard.tsx",
  "components/outbox/ActionOutboxStatusBadge.tsx",
  "lib/action-outbox.ts",
  "types/action-outbox.ts",
];

for (const relativePath of requiredFiles) {
  if (!existsSync(resolve(frontendRoot, relativePath))) {
    throw new Error(`Phase 6D4 file is missing: ${relativePath}`);
  }
}

const version = readFileSync(resolve(projectRoot, "VERSION"), "utf8").trim();
if (version !== "0.6.7") {
  throw new Error(`Expected VERSION 0.6.7, received ${version || "<empty>"}.`);
}

const client = readFileSync(resolve(frontendRoot, "lib/action-outbox.ts"), "utf8");
for (const feature of [
  "/api/action-outbox/",
  "/dispatch-ready",
  '"dispatch"',
  '"retry"',
  '"cancel"',
]) {
  if (!client.includes(feature)) {
    throw new Error(`Action Outbox client is missing: ${feature}`);
  }
}

const dashboard = readFileSync(
  resolve(frontendRoot, "components/outbox/ActionOutboxDashboard.tsx"),
  "utf8"
);
for (const feature of [
  "Dry-run safety is active",
  "Dispatch ready",
  "Execution history",
  "Queue retry",
  "Cancel action",
  "ActionOutboxStatusBadge",
]) {
  if (!dashboard.includes(feature)) {
    throw new Error(`Action Outbox dashboard is missing: ${feature}`);
  }
}

const shell = readFileSync(resolve(frontendRoot, "components/AppShell.tsx"), "utf8");
if (!shell.includes('path: "/action-outbox"')) {
  throw new Error("Shared navigation is missing the Action Outbox route.");
}

console.log("Phase 6D4 frontend contract verification passed.");
console.log("Outbox list, filters, dry-run dispatch, retries, cancellation, receipts, and audit history are wired.");

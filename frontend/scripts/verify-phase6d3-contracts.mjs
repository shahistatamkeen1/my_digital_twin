import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(currentDir, "..");
const projectRoot = resolve(frontendRoot, "..");

const requiredFiles = [
  "app/approvals/page.tsx",
  "components/approvals/ApprovalInbox.tsx",
  "components/approvals/ApprovalDetailDrawer.tsx",
  "components/approvals/ApprovalProvider.tsx",
  "components/approvals/PendingApprovalBadge.tsx",
  "components/approvals/ApprovalQuickAccess.tsx",
  "lib/approvals.ts",
  "lib/agent-runs.ts",
  "types/approvals.ts",
];

for (const relativePath of requiredFiles) {
  if (!existsSync(resolve(frontendRoot, relativePath))) {
    throw new Error(`Phase 6D3 file is missing: ${relativePath}`);
  }
}

const version = readFileSync(resolve(projectRoot, "VERSION"), "utf8").trim();
if (version !== "0.6.5") {
  throw new Error(`Expected VERSION 0.6.5, received ${version || "<empty>"}.`);
}

const approvalClient = readFileSync(resolve(frontendRoot, "lib/approvals.ts"), "utf8");
for (const endpoint of ["/api/approvals/", "approveApproval", "rejectApproval", "${approvalId}/${decision}"]) {
  if (!approvalClient.includes(endpoint)) throw new Error(`Approval client is missing endpoint: ${endpoint}`);
}

const runClient = readFileSync(resolve(frontendRoot, "lib/agent-runs.ts"), "utf8");
for (const endpoint of ["/resume", "/timeline"]) {
  if (!runClient.includes(endpoint)) throw new Error(`Agent run client is missing endpoint: ${endpoint}`);
}

const inbox = readFileSync(resolve(frontendRoot, "components/approvals/ApprovalInbox.tsx"), "utf8");
for (const feature of ["approveApproval", "rejectApproval", "resumeAgentRun", "refreshPendingCount", "ApprovalDetailDrawer"]) {
  if (!inbox.includes(feature)) throw new Error(`Approval Inbox is missing feature: ${feature}`);
}

const drawer = readFileSync(resolve(frontendRoot, "components/approvals/ApprovalDetailDrawer.tsx"), "utf8");
for (const feature of ["Edit & approve", "Reject and resume workflow", "Decision history", "Workflow timeline", "JSON.parse"]) {
  if (!drawer.includes(feature)) throw new Error(`Approval drawer is missing feature: ${feature}`);
}

const layout = readFileSync(resolve(frontendRoot, "app/layout.tsx"), "utf8");
const shell = readFileSync(resolve(frontendRoot, "components/AppShell.tsx"), "utf8");
const runTypes = readFileSync(resolve(frontendRoot, "types/agent-runs.ts"), "utf8");
if (!layout.includes("ApprovalProvider")) throw new Error("Root layout is missing ApprovalProvider.");
if (!shell.includes("PendingApprovalBadge") || !shell.includes('path: "/approvals"')) throw new Error("Navigation is missing the approval badge.");
for (const status of ["awaiting_approval", "approved", "rejected", "resuming"]) {
  if (!runTypes.includes(status)) throw new Error(`Agent run contracts are missing status: ${status}`);
}

console.log("Phase 6D3 frontend contract verification passed.");
console.log("Inbox, decision controls, badges, resume recovery, timeline, and durable statuses are wired.");

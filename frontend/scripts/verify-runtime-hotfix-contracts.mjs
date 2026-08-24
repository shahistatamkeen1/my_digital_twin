import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(currentDir, "..");
const projectRoot = resolve(frontendRoot, "..");

const requiredFiles = [
  "app/agent-profiles/page.tsx",
  "app/agent-reflections/page.tsx",
  "app/personal-hq/page.tsx",
  "app/twin-personality/page.tsx",
  "components/AppShell.tsx",
];

for (const relativePath of requiredFiles) {
  if (!existsSync(resolve(frontendRoot, relativePath))) {
    throw new Error(`Runtime hotfix file is missing: ${relativePath}`);
  }
}

const version = readFileSync(resolve(projectRoot, "VERSION"), "utf8").trim();
if (version !== "0.6.7") {
  throw new Error(`Expected VERSION 0.6.7, received ${version || "<empty>"}.`);
}

const shell = readFileSync(resolve(frontendRoot, "components/AppShell.tsx"), "utf8");
if (!shell.includes('path: "/twin-personality"')) {
  throw new Error("Profiles navigation does not use the canonical route.");
}
if (shell.includes('path: "/agent-profiles"')) {
  throw new Error("Profiles navigation still uses the missing legacy route.");
}

const redirect = readFileSync(resolve(frontendRoot, "app/agent-profiles/page.tsx"), "utf8");
for (const feature of ["permanentRedirect", '"/twin-personality"']) {
  if (!redirect.includes(feature)) {
    throw new Error(`Legacy Profiles compatibility route is missing: ${feature}`);
  }
}

const profiles = readFileSync(resolve(frontendRoot, "app/twin-personality/page.tsx"), "utf8");
for (const feature of ["AppShell", "requireApiSuccess", "No learned profiles yet", "Refresh profiles"]) {
  if (!profiles.includes(feature)) {
    throw new Error(`Profiles page is missing runtime feature: ${feature}`);
  }
}

const reflections = readFileSync(resolve(frontendRoot, "app/agent-reflections/page.tsx"), "utf8");
for (const feature of ["AppShell", "/api/agent-reflections/generate", "Generate reflections", "No reflections yet", "requireApiSuccess"]) {
  if (!reflections.includes(feature)) {
    throw new Error(`Reflections page is missing runtime feature: ${feature}`);
  }
}

const hq = readFileSync(resolve(frontendRoot, "app/personal-hq/page.tsx"), "utf8");
for (const feature of ["requireApiSuccess", "Personal HQ could not load", "Retry Personal HQ", "OPENAI_API_KEY"]) {
  if (!hq.includes(feature)) {
    throw new Error(`Personal HQ is missing runtime feature: ${feature}`);
  }
}
if (hq.includes('alert("Could not load Command Center.")')) {
  throw new Error("Personal HQ still hides API failures behind a generic alert.");
}

console.log("Runtime intelligence UI hotfix verification passed.");
console.log("Navigation, compatibility redirect, shell integration, controls, empty states, and API errors are wired.");

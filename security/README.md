# Security and supply-chain checks

Phase 5C adds repeatable checks for secrets, vulnerable dependencies, container
images, Docker configuration, and software bills of materials (SBOMs).

## Blocking policy

- Secret findings block the build.
- Unaccepted Python vulnerability IDs block the build.
- Critical npm vulnerabilities block the build.
- Critical Trivy filesystem, configuration, or image findings block the build.
- High findings are reported as artifacts for review but do not block Phase 5C.

The policy is stored in `security/policy.json`.

## Accepted risks

Do not suppress a finding merely to make CI green. Before adding an exception:

1. Confirm the finding applies to the exact installed version.
2. Record why the risk is not exploitable or cannot yet be fixed.
3. Add a removal date and tracking issue.
4. Prefer upgrading or removing the dependency.

Python vulnerability exceptions belong in
`python.ignored_vulnerability_ids`. npm package exceptions belong in
`npm.allowed_packages`.

## Reports

Local reports are generated under `build/security/` and are ignored by Git.
CI uploads security reports and CycloneDX SBOMs as workflow artifacts.

## Local execution

From the repository root:

```powershell
powershell -ExecutionPolicy Bypass `
  -File ".\scripts\security\scan-local.ps1"
```

Add `-InstallDependencies` the first time or after changing
`backend/requirements-dev.txt`.

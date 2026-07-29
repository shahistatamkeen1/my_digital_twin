# Application security

## Reporting a vulnerability

Do not open a public issue containing credentials, tokens, personal data, or
exploit details. Contact the repository owner privately and include:

- affected component and version;
- reproducible steps;
- expected impact;
- suggested remediation, when known.

Do not include real user data or production credentials in proof-of-concept
material.

## Secrets

Runtime secrets belong only in ignored local environment files or the
deployment platform's secret manager. They must never be committed to Git.

Ignored local files include:

- `backend/.env`
- `frontend/.env.local`
- `.env.docker`

Templates may document variable names but must contain only placeholders.

## Dependency and image policy

The repository uses pip-audit, npm audit, Gitleaks, Trivy, Dependabot, and
CycloneDX SBOM generation. Critical findings block the security workflow.
Unaccepted Python advisory IDs and secret findings also block it.

See `security/README.md` and `security/policy.json`.

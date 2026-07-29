# Incident Response

## Severity guide

- **SEV-1:** Data exposure, active credential compromise, destructive database event, or complete production outage.
- **SEV-2:** Authentication failure, widespread feature outage, failed deployment with customer impact, or severe performance degradation.
- **SEV-3:** Limited feature failure, elevated errors, or non-critical dependency degradation.

## First actions

1. Record the time, affected environment, release version, symptoms, and request IDs.
2. Stop further deployments.
3. Preserve application, reverse-proxy, database, and GitHub Actions logs.
4. Check `/live`, `/ready`, and authenticated diagnostics.
5. Determine whether the issue began after a code, configuration, dependency, or infrastructure change.

## Credential exposure

1. Revoke or rotate the exposed credential immediately.
2. Replace the value in the appropriate secret store.
3. Search Git history and security reports to identify exposure scope.
4. Remove the secret from current files and rewrite Git history when required by policy.
5. Rebuild and redeploy images because secrets may have entered image layers.
6. Document the incident without copying the secret value into tickets or chat.

## Database incident

1. Stop writes when continued operation risks further corruption.
2. Preserve the current volume and take a backup when safe.
3. Identify the last known good backup and its Alembic revision.
4. Restore into a separate database first and validate tables, row counts, authentication, and readiness.
5. Switch production only after verification and approval.

## Failed deployment

1. Inspect deployment and container logs.
2. Do not downgrade PostgreSQL automatically.
3. Confirm that the previous application images are compatible with the current schema.
4. Use `rollback.sh` only after reviewing schema compatibility.
5. Restore the pre-deployment database backup when the failure includes an incompatible migration.

## Communication and closure

- Provide status updates appropriate to incident severity.
- Record root cause, contributing factors, detection gaps, and corrective actions.
- Add regression tests, monitoring, or runbook changes before closing the incident.
- Rotate any temporary diagnostic credentials created during response.

# Final Release Checklist

## Before publishing images

- [ ] `git status` is clean on `master`.
- [ ] `VERSION`, application defaults, environment templates, image tags, and documentation are synchronized.
- [ ] All quality, migration, Docker, security, and final-readiness workflows are green.
- [ ] `PUBLIC_API_BASE_URL` is a real HTTPS backend URL controlled by the project owner.
- [ ] The URL is not `localhost`, an example hostname, or a documentation placeholder.
- [ ] Production secrets and GitHub Environment protection rules are configured.
- [ ] Release notes and migration impact have been reviewed.

## Before deployment

- [ ] Published backend and frontend image digests are recorded.
- [ ] PostgreSQL backup destination has sufficient capacity.
- [ ] Restore procedure has been tested.
- [ ] Previous image references and rollback state are available.
- [ ] Schema compatibility with a possible application rollback is understood.
- [ ] DNS, TLS, CORS, cookie domain, and reverse-proxy settings are correct.
- [ ] A maintenance window or stakeholder communication is prepared when needed.

## After deployment

- [ ] Frontend loads over HTTPS.
- [ ] `/live`, `/health`, and `/ready` succeed.
- [ ] Backend reports the expected application version.
- [ ] Login, logout, refresh, and one workflow from each twin have been tested.
- [ ] Existing data remains accessible only to its owner.
- [ ] Logs contain request IDs and no secret values.
- [ ] Metrics and alerts are receiving production signals.
- [ ] Deployment state and pre-deployment backup paths are recorded.

# Phase 5D release process

Phase 5D publishes versioned backend and frontend images to GitHub Container
Registry (GHCR), generates SBOM/provenance metadata, creates a release
manifest, and attaches a deployment bundle to the GitHub Release.

## Version source of truth

The release version is stored in `VERSION`. The following values must match it:

- `backend/.env.example`
- `.env.docker.example`
- `backend/app/config.py`
- `docker-compose.yml`

Validate locally:

```powershell
python .\scripts\release\validate_release.py
```

## Repository configuration

In GitHub, open **Settings → Secrets and variables → Actions → Variables** and
create:

```text
PUBLIC_API_BASE_URL=https://api.example.com
```

This URL is embedded in the Next.js image during the release build. It cannot
be changed after the frontend image is published without rebuilding it.

The workflow publishes:

```text
ghcr.io/<owner>/<repository>-backend:<version>
ghcr.io/<owner>/<repository>-frontend:<version>
```

It also creates `latest` tags for stable releases and `sha-<commit>` tags.

## Dry-run release build

Open **Actions → Release container images → Run workflow**.

Use:

```text
version: 0.5.3
public_api_url: http://localhost:8000
publish: false
```

The workflow runs validation, frontend quality checks, and image builds without
pushing packages.

## Publish a release

1. Merge the Phase 5 branch into `master`.
2. Confirm all quality and security workflows pass.
3. From a clean local `master` branch:

```powershell
git tag -a v0.5.3 -m "My Digital Twin v0.5.3"
git push origin v0.5.3
```

The tag triggers `.github/workflows/release.yml`.

The workflow:

1. Validates version synchronization.
2. Runs the Phase 5D contract tests.
3. Runs the frontend quality gate.
4. Builds multi-platform backend and frontend images.
5. Publishes both images to GHCR.
6. Generates signed GitHub artifact attestations.
7. Produces a release manifest and deployment ZIP.
8. Creates or updates GitHub Release `v0.5.3`.

## Verify an attestation

After installing GitHub CLI and authenticating:

```bash
gh attestation verify \
  oci://ghcr.io/OWNER/REPOSITORY-backend:0.5.3 \
  --repo OWNER/REPOSITORY
```

Repeat for the frontend image.

## Image visibility

A public repository does not automatically guarantee that its GHCR packages
are public. Open each package under the repository owner’s **Packages** page and
set the visibility intentionally. Private deployment runners can pull private
packages with a token that has `read:packages`.

# Runtime Intelligence UI Hotfix

Version 0.6.6 repairs the authenticated navigation and runtime states for
Personal HQ, Agent Profiles, and Agent Reflections without changing the
database schema or workflow engine.

## Corrected behavior

- The shared navigation now opens the canonical `/twin-personality` Profiles
  page.
- The retired `/agent-profiles` path permanently redirects to the canonical
  route so bookmarks do not fail.
- Profiles and Reflections render inside `AppShell`, preserving desktop and
  mobile navigation.
- Profiles provides loading, refresh, empty, and API error states.
- Reflections provides Generate and Refresh controls plus success, empty, and
  API error states.
- Personal HQ validates the API response before rendering and displays the
  backend error and request reference instead of parsing an error payload as
  dashboard data.
- Personal HQ explains that its executive intelligence requires a configured
  OpenAI provider. Secrets remain in the runtime environment and are never
  exposed to the browser.

## Runtime data flow

Agent Profiles are learned from saved `AgentMemory` records. Reflections are
generated from those learned profiles. A new account can therefore see valid
empty states until AI-powered interactions have produced memories.

```text
AI-powered interaction
  -> agent memories
  -> learned agent profiles
  -> generated reflections
```

Personal HQ uses `/api/v1/twin-notifications/`, which runs executive
intelligence across Career, Finance, Health, Learning, and Personal Memory. A
real `OPENAI_API_KEY` is required for that route.

## Docker refresh

After applying the hotfix:

```powershell
docker compose --env-file .env.docker up --build -d
docker compose --env-file .env.docker ps
```

If only the OpenAI key changed, recreate the backend:

```powershell
docker compose --env-file .env.docker up -d --force-recreate backend
```

## Verification

```powershell
cd frontend
npm run verify:runtime-hotfix
npm run typecheck
npm run lint
npm run build
```

No Alembic migration is introduced. The database head remains
`20260813_0007`.

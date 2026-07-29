# My Digital Twin

My Digital Twin is a multi-agent AI personal operating system that helps users manage career growth, job applications, finances, and personal planning through specialized digital twins.

## Features

### Twin Hub

* Spatial landing page
* Twin selection hub
* Master Twin Orchestrator
* Career Twin
* Finance Twin
* Health Twin and Learning Twin placeholders

### Career Twin

* Career dashboard
* Career memory
* Resume upload and analysis
* Real job discovery
* ATS resume optimizer
* Resume tailoring
* Cover letter generator
* Interview preparation agent
* Application tracker
* Application Kanban pipeline
* Career intelligence
* Career Twin chat
* Chrome extension autofill assistant

### Finance Twin

* Finance dashboard
* Finance memory
* Income and expense tracking
* Category analytics
* Savings goals
* AI finance insights
* Finance Twin chat

### Twin Orchestrator

* Combines Career Twin and Finance Twin context
* Routes user questions to the correct twin
* Provides cross-agent recommendations

## Tech Stack

### Frontend

* Next.js
* TypeScript
* Tailwind CSS
* React Markdown

### Backend

* FastAPI
* Python
* SQLAlchemy
* PostgreSQL
* Alembic

### AI

* OpenAI API
* Context-aware AI agents
* Multi-agent orchestration

### External APIs

* Adzuna Jobs API

## Project Architecture

```text
My Digital Twin
├── Landing Page
├── Twin Hub
├── Twin Orchestrator
├── Career Twin
│   ├── Dashboard
│   ├── Memory
│   ├── Resume Center
│   ├── Job Discovery
│   ├── Applications
│   ├── Pipeline
│   ├── Interview Prep
│   ├── Cover Letter
│   └── Career Chat
└── Finance Twin
    ├── Dashboard
    ├── Memory
    ├── Transactions
    ├── Category Analytics
    ├── Savings Goals
    ├── AI Insights
    └── Finance Chat
```

## Screenshots

Add screenshots inside:

```text
frontend/public/screenshots
```

Recommended screenshots:

* Landing Page
* Twin Hub
* Career Dashboard
* Job Discovery
* ATS Optimizer
* Career Chat
* Finance Dashboard
* Finance Chat
* Twin Orchestrator

## Local Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create `backend/.env`:

```env
OPENAI_API_KEY=your_openai_api_key
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Status

Career Twin and Finance Twin are functional. Twin Orchestrator is implemented. Health Twin and Learning Twin are planned future modules.

## Docker local production simulation

Phase 5B provides container images for PostgreSQL, FastAPI, and Next.js.

```powershell
Copy-Item .env.docker.example .env.docker
# Replace the CHANGE_ME values in .env.docker.
docker compose --env-file .env.docker up --build -d
```

Open:

- Frontend: `http://localhost:3000`
- API readiness: `http://localhost:8000/ready`
- API documentation: `http://localhost:8000/api/v1/docs`

See `docs/DOCKER.md` for setup, verification, logs, shutdown, and reset instructions.



## Security and supply-chain validation

Phase 5C adds secret scanning, Python and npm dependency audits, Trivy
filesystem/configuration/image scans, CycloneDX SBOM generation, and
Dependabot updates.

```powershell
powershell -ExecutionPolicy Bypass `
  -File ".\scripts\security\scan-local.ps1"
```

Generated reports are written to `build/security/`. See
`docs/SECURITY.md` and `security/README.md`.

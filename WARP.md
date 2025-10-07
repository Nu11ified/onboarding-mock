# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project summary
- Fullstack Next.js + Python starter integrating LlamaIndex (agent), CopilotKit (runtime/UI wiring), and Composio (Google Sheets tools). The UI runs on Next.js; the agent is a FastAPI service with LlamaIndex AG-UI router. The CopilotKit Next endpoint bridges the UI to the Python agent.

Common commands
- Install deps (installs both Node and Python via uv):
  - pnpm install
  - npm install
  - yarn install
  - bun install
- Dev (UI + Agent):
  - pnpm dev
  - npm run dev
  - yarn dev
  - bun run dev
- Dev (only UI):
  - npm run dev:ui
- Dev (only Agent):
  - npm run dev:agent
- Build (Next production build):
  - npm run build
- Start (Next production server):
  - npm run start
- Lint (ESLint via Next):
  - npm run lint
- Agent dependencies (Python, if needed manually):
  - npm run install:agent
  - or: (cd agent && uv sync)

Notes
- Postinstall runs agent dependency sync (uv) automatically.
- Dev ports: UI on 3000, Agent on 9000 (see src/app/api/copilotkit/route.ts and agent/agent/server.py).
- Tests: no test scripts/config detected for either the Next.js app or the Python agent at this time.

Environment configuration
- Backend (required): create agent/.env from agent/.env.example and set:
  - OPENAI_API_KEY
  - COMPOSIO_API_KEY
  - COMPOSIO_GOOGLESHEETS_AUTH_CONFIG_ID
  - COMPOSIO_USER_ID (defaults to "default")
- Frontend (optional): create .env.local from .env.local.example and set:
  - COPILOT_CLOUD_PUBLIC_API_KEY (optional; CopilotKit Cloud features)

Architecture overview
- Frontend (Next.js, src/app)
  - CopilotKit provider is configured in src/app/layout.tsx with runtimeUrl "/api/copilotkit" and agent "sample_agent".
  - Primary landing UI: src/app/page.tsx renders the onboarding chat and routes to /dashboard with a selected scenario.
  - API routes (Next App Router):
    - src/app/api/copilotkit/route.ts creates a CopilotRuntime with agents.sample_agent pointing to the Python agent at http://127.0.0.1:9000/run.
    - src/app/api/sheets/list/route.ts proxies list-of-sheets to the Python agent (/sheets/list) using AGENT_URL env var if present; defaults to http://localhost:9000.
    - src/app/api/v2/* contains mocked endpoints for onboarding flows (e.g., agent/start, ingest/validate-schema) that simulate async operations and structured responses to drive the demo dashboard/flows.
  - Components and state (selected highlights):
    - src/lib/canvas/* defines the shared state shape and update helpers used by the UI; mirrors fields the agent knows about (projects, entities, notes, charts).

- CopilotKit runtime bridge (Next -> Python)
  - The Next endpoint at /api/copilotkit uses @ag-ui/llamaindex’s LlamaIndexAgent adapter to call the Python agent’s /run endpoint. This carries state/messages between the browser CopilotKit UI and the agent.

- Backend (Python agent, FastAPI)
  - Entry: agent/agent/server.py
    - Loads .env variants from repo/agent roots when available.
    - Mounts agentic_chat_router from agent/agent/agent.py (LlamaIndex AG-UI router).
    - Adds REST endpoints for Google Sheets workflows via Composio:
      - POST /sheets/sync: import from Sheets -> canvas format.
      - POST /sync-to-sheets: sync canvas state -> Sheets (handles deletions appropriately).
      - POST /sheets/list: list sheet names in a spreadsheet.
      - POST /sheets/create: create a new spreadsheet and return id/url.
  - Agent configuration: agent/agent/agent.py
    - Uses OpenAI model via LlamaIndex and defines:
      - Frontend tool signatures: createItem, setItemName, setNoteField1, setProjectField*, setEntityField*, chart setters, setSyncSheetId, etc. These are invoked by the model but executed on the UI.
      - Backend tools: dynamically loads Composio tools if COMPOSIO_TOOL_IDS is set; always includes a list_sheet_names tool.
      - System prompt establishes Google Sheets as source of truth, enables auto-sync rules, and requires checking/initiating Composio auth before GOOGLESHEETS_* actions.
      - Initial shared state keys match the UI’s canvas model (items, globalTitle/Description, syncSheetId/Name, etc.).
  - Sheets integration helpers: agent/agent/sheets_integration.py
    - get_sheet_data, convert_sheet_to_canvas_items, sync_canvas_to_sheet, list and create helpers via Composio.
    - Converts Sheets rows to canvas items; chart detection for numeric rows; basic date/tag parsing; bidirectional sync that prunes extra rows on Sheets.

Operational tips specific to this repo
- If CopilotKit shows tool-connection issues, verify the Python agent is running on port 9000 and that OPENAI_API_KEY and Composio vars are set in agent/.env.
- The CopilotKit Next endpoint is hardcoded to http://127.0.0.1:9000/run; keep the agent bound locally or update src/app/api/copilotkit/route.ts if changing ports/hosts.
- Some Next API routes under src/app/api/v2 are mocked for demo flows; avoid assuming production behaviors there.

References from README
- Available scripts: dev, dev:debug, dev:ui, dev:agent, install:agent, build, start, lint.
- Postinstall installs Python agent dependencies via uv.
- Quickstart covers Sheets integration and environment setup; see README.md for the detailed walkthrough.

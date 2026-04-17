# Boston 311 Agent : One Conversation. Every City Service.

A multilingual voice + text AI agent that takes one natural language question from a Boston resident and orchestrates across multiple data sources to return one clear, friendly answer. Built for older adults and non-English speakers who deserve the same access to city services as everyone else.

> "Has my pothole on Blue Hill Ave been fixed? And is it worth going outside today?"
>
> → Checks Boston 311 cases + live weather + today's events → one warm, combined response in your language.

## What it does

Ask anything about Boston city services in any language. The agent calls the right tools in parallel, combines the results, and responds in the same language you wrote in.

| Tool | What it does |
|------|-------------|
| **query_311_cases** 🏛️ | Search Boston 311 service requests by street, neighborhood, or complaint type. Checks open potholes, trash pickup, graffiti, sidewalk repairs, and more — with real case IDs and status |
| **get_weather** ☀️ | Live Boston weather via Open-Meteo (no API key needed) — temperature, conditions, precipitation chance, plain-English summary |
| **get_local_events** 🎉 | Today's events in Boston — free concerts, farmers markets, community activities |
| **get_neighborhood_trends** 📈 | 311 complaint volume trends for any neighborhood over the last 30 days |

**Languages supported:** English, Spanish, Portuguese — and any other language the underlying model handles. The agent detects your language and responds in kind.

## UI

Three-panel interface built with Next.js 15 and React 19:

| Panel | What it shows |
|-------|--------------|
| **Live Sidebar** (left) | Real-time MBTA alerts, current weather, today's events, and recent 311 reports — auto-refreshes every 2 minutes |
| **Chat** (center) | Conversational interface with streaming AI responses, conversation history, multilingual quick-start prompts, and quick-action cards |
| **Reasoning Panel** (right) | Live visibility into the agent's thinking — reasoning steps, tool calls with icons (🏛️☀️🎉📈), parameters, and results as they stream in |

## Architecture

```
User query (any language)
    │
    ▼
/api/agent/stream
    │
    ├── fetchAllBostonData()        ← parallel pre-fetch: MBTA + Weather + Events + 311 buzz
    │       └── injected into instructions as context
    │
    └── client.stream()             ← Subconscious TIM agent
            │
            ├── query_311_cases     ← Boston Open Data SQL API (2026 + 2025 resources)
            ├── get_weather         ← Open-Meteo (no API key)
            ├── get_local_events    ← curated Boston events
            ├── get_neighborhood_trends ← 311 trend analysis
            └── synthesized answer  ← streamed back as SSE, in user's language
```

Tools are function tools hosted at `/api/tools` — the dev tunnel (`npm run dev`) exposes them publicly so the Subconscious platform can call back.

## Project structure

```
app/
├── api/
│   ├── agent/
│   │   ├── route.ts            # Sync agent endpoint
│   │   └── stream/route.ts     # Streaming SSE endpoint (primary)
│   ├── live-data/
│   │   └── route.ts            # Live data for sidebar
│   └── tools/
│       └── route.ts            # 311, weather, events, trends dispatchers
├── layout.tsx
├── page.tsx
└── globals.css

ui/
├── Layout.tsx                  # Three-column layout
├── Header.tsx                  # "Boston 311 — One Conversation. Every City Service."
├── ChatView.tsx                # SSE streaming + message history
├── ChatInput.tsx               # Input with suggestion chips
├── ChatMessage.tsx             # Markdown rendering per message
├── WelcomeScreen.tsx           # Multilingual prompts + quick-action cards
├── LiveSidebar.tsx             # Left panel — live Boston data
├── ReasoningPanel.tsx          # Right panel — tool icons + reasoning steps
└── theme.css                   # Design tokens

lib/
├── boston-data.ts              # All data fetchers + 4 tool functions
├── subconscious.ts             # SDK singleton
├── tools.ts                    # Tool definitions with icons (method: POST)
├── types.ts                    # System prompt (multilingual), buildInstructions()
└── stream-parser.ts            # Incremental SSE JSON parser

scripts/
└── dev-tunnel.mjs              # Auto-reconnecting localtunnel
```

## Local development

```bash
git clone <your-repo-url>
cd boston-311
npm install
cp .env.example .env.local
```

Add your Subconscious API key to `.env.local`:

```
SUBCONSCIOUS_API_KEY=your_key_here
```

Then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run dev` starts a [localtunnel](https://github.com/localtunnel/localtunnel) automatically so Subconscious can call your function tools. If the tunnel is unavailable, run without it (platform tools only):

```bash
npm run dev:no-tunnel
```

## Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `SUBCONSCIOUS_API_KEY` | **Yes** | [subconscious.dev/platform](https://subconscious.dev/platform) |
| `SUBCONSCIOUS_ENGINE` | No | Default: `tim-gpt`. Options: `tim-edge`, `tim-gpt-heavy` |

Weather uses [Open-Meteo](https://open-meteo.com/) — no API key needed. 311 data uses the [Boston Open Data](https://data.boston.gov/) Socrata API — also no key needed.

## 311 data sources

Live Boston 311 data is pulled from the city's open data portal:

- **2026 cases:** resource `1a0b420d-99f1-4887-9851-990b2a5a6e17`
- **2025 cases:** resource `9d7c2214-4709-478a-a2e8-fb2020a5bb94` (fallback for older cases)

The `query_311_cases` tool uses Socrata SQL (`datastore_search_sql`) with `ILIKE` pattern matching so it can find cases by street name (e.g. `location_street_name ILIKE '%Blue Hill%'`), neighborhood, or complaint type.

## Adding data sources

To add a new tool (e.g. parking availability, school closures):

1. Add a fetch function in `lib/boston-data.ts`
2. Register the handler in `app/api/tools/route.ts`
3. Add the tool definition in `lib/tools.ts` (type: `"function"`, method: `"POST"`)
4. Update the system prompt in `lib/types.ts` to tell the agent the tool exists

## Learn more

- [Subconscious Docs](https://docs.subconscious.dev)
- [Boston Open Data — 311 Service Requests](https://data.boston.gov/dataset/311-service-requests)
- [Open-Meteo API](https://open-meteo.com/)
- [MBTA API v3](https://api-v3.mbta.com/docs/swagger/index.html)

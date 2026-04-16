# BostonPulse

Real-time Boston city intelligence powered by the [Subconscious](https://subconscious.dev) agent platform. Ask anything about Boston — transit, weather, events, what's happening tonight — and get a live, synthesized answer pulled from the MBTA API, OpenWeatherMap, Ticketmaster, Reddit, and real-time web/tweet search.

## Demo

[![Watch the demo](https://img.shields.io/badge/▶_Watch_Demo-YouTube-red?style=for-the-badge&logo=youtube)](https://youtu.be/1tFCFxeNiFU)

## UI

BostonPulse features a three-panel real-time interface built with Next.js 15 and React 19:

| Panel | What it shows |
|-------|--------------|
| **Live Sidebar** (left) | Real-time MBTA transit alerts, current weather, today's events, and city buzz from Reddit — auto-refreshes every 2 minutes |
| **Chat** (center) | Conversational interface with streaming AI responses rendered as markdown, conversation history, and quick-action suggestion cards |
| **Reasoning Panel** (right) | Live visibility into the agent's thinking process — reasoning steps, tool invocations with parameters/results, and a tools summary timeline |

**Design highlights:**
- Dark glassmorphism theme with translucent surfaces and backdrop blur
- Real-time streaming with typing indicators and animated reasoning timeline
- Collapsible sidebars with smooth transitions — toggle from the header
- Responsive layout that adapts to different screen sizes
- MBTA line-colored transit alerts (Red, Orange, Green, Blue, Silver)
- Skeleton loading states while data is being fetched

## What it does

BostonPulse pre-fetches live data from four sources before the agent runs, then passes it as context in the prompt so the agent can synthesize a concise answer immediately:

| Data source | What it provides |
|-------------|-----------------|
| **MBTA API v3** | Live transit alerts — delays, closures, service changes across subway, bus, and commuter rail |
| **OpenWeatherMap** | Current Boston conditions — temperature, wind, humidity, rain |
| **Ticketmaster** | Today's events — games, concerts, shows in the Boston area |
| **Reddit r/boston** | City buzz — trending community posts, local discussions |

The agent also has access to Subconscious platform tools (`tweet_search`, `fresh_search`, `web_search`, `news_search`) to pull in real-time social chatter and breaking local news.

Responses are formatted as structured markdown with emoji section headers, rendered in the UI via `react-markdown`.

## Architecture

Live data is fetched **server-side** in the Next.js API route before calling the agent — not as function-tool callbacks. This means the app works without a public tunnel URL and deploys cleanly to Vercel with no networking complexity.

```
User query
    │
    ▼
/api/agent/stream
    │
    ├── fetchAllBostonData()        ← runs in parallel: MBTA + Weather + Events + Buzz
    │       │
    │       └── injected into instructions as a pre-fetched context block
    │
    └── client.stream()             ← Subconscious TIM agent
            │
            ├── tweet_search        ← what Bostonians are saying right now
            ├── fresh_search        ← breaking local news
            └── synthesized answer  ← streamed back to UI as SSE
```

## Project structure

```
app/
├── api/
│   ├── agent/
│   │   ├── route.ts            # Sync agent endpoint
│   │   └── stream/route.ts     # Streaming SSE endpoint (primary)
│   ├── live-data/
│   │   └── route.ts            # Public endpoint for sidebar live data
│   └── tools/
│       └── route.ts            # Self-hosted tool dispatcher
├── layout.tsx                  # Root layout with fonts and metadata
├── page.tsx                    # Entry point — renders Layout
└── globals.css                 # Global styles, animations, theme imports

ui/                             # Primary UI components
├── Layout.tsx                  # Three-column layout with collapsible panels
├── Header.tsx                  # Top nav with sidebar toggles and live indicator
├── ChatView.tsx                # Message history + SSE streaming integration
├── ChatInput.tsx               # User input with suggestion chips
├── ChatMessage.tsx             # Individual message with markdown rendering
├── WelcomeScreen.tsx           # Initial state with quick-action cards
├── LiveSidebar.tsx             # Left panel — MBTA, weather, events, buzz
├── ReasoningPanel.tsx          # Right panel — reasoning steps and tool timeline
└── theme.css                   # Design tokens and CSS variables

lib/
├── boston-data.ts               # Live data fetchers (MBTA, weather, events, buzz)
├── subconscious.ts             # SDK singleton
├── tools.ts                    # Platform tool config (web_search, tweet_search, etc.)
├── types.ts                    # System prompt, buildInstructions(), shared types
└── stream-parser.ts            # Incremental JSON stream parser for SSE deltas

components/                     # Legacy components (kept for reference)
├── AgentRunner.tsx
├── RunResult.tsx
├── ReasoningDisplay.tsx
├── ToolPanel.tsx
└── StreamingText.tsx

scripts/
└── dev-tunnel.mjs              # Auto-reconnecting localtunnel for local development
```

## Local development

```bash
git clone <your-repo-url>
cd BostonPulse
npm install
cp .env.example .env.local
```

Edit `.env.local` and fill in all three API keys (see below), then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run dev` starts a [localtunnel](https://github.com/localtunnel/localtunnel) automatically so the Subconscious platform can reach any self-hosted tools. If you only need platform tools (the default), you can skip it:

```bash
npm run dev:no-tunnel
```

## Environment variables

| Variable | Required | Where to get it |
|----------|----------|----------------|
| `SUBCONSCIOUS_API_KEY` | **Yes** | [subconscious.dev/platform](https://subconscious.dev/platform) |
| `OPENWEATHERMAP_API_KEY` | **Yes** | [openweathermap.org/api](https://openweathermap.org/api) — free tier, key activates within 2 hours |
| `TICKETMASTER_API_KEY` | **Yes** | [developer.ticketmaster.com](https://developer.ticketmaster.com/) — free, instant |
| `SUBCONSCIOUS_ENGINE` | No | Default: `tim-gpt`. Options: `tim`, `tim-edge`, `tim-gpt-heavy` |

Without `OPENWEATHERMAP_API_KEY` or `TICKETMASTER_API_KEY`, the agent will fall back to using `web_search` to find that data. The MBTA feed is public and requires no key.

## Engines

| Engine | Best for |
|--------|----------|
| `tim-gpt` | Default — good balance of speed and quality |
| `tim-edge` | Fastest responses |
| `tim-gpt-heavy` | Most thorough reasoning |

Full list at [docs.subconscious.dev/engines](https://docs.subconscious.dev/engines).

## Adding data sources

To add a new live data source (e.g. Red Sox schedule, parking availability):

1. Add a fetch function in `lib/boston-data.ts`
2. Call it inside `fetchAllBostonData()` alongside the existing `Promise.all`
3. Extend the `BostonLiveData` interface and add it to the context block in `buildLiveDataBlock()` in `lib/types.ts`
4. Update the system prompt in `lib/types.ts` to tell the agent the new data is available

No tool registration needed — data is injected as context, not fetched by the agent.

## Learn more

- [Subconscious Docs](https://docs.subconscious.dev)
- [Subconscious Node.js SDK](https://github.com/subconscious-systems/subconscious-node)
- [MBTA API v3](https://api-v3.mbta.com/docs/swagger/index.html)
- [OpenWeatherMap Current Weather API](https://openweathermap.org/current)
- [Ticketmaster Discovery API](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/)

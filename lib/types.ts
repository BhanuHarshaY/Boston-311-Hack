/**
 * Shared types for BostonPulse agent requests and responses.
 */
export interface AgentRequest {
  message: string;
  conversationHistory?: ChatMessage[];
}
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
export interface AgentResponse {
  answer: string;
  runId: string;
  toolCalls?: ToolCallInfo[];
}
export interface ToolCallInfo {
  name: string;
  input: Record<string, unknown>;
  output?: unknown;
}

const SYSTEM_PROMPT = `You are BostonPulse — Boston's real-time city intelligence assistant.
Live Boston data (MBTA alerts, weather, events) is pre-fetched and provided below. Use it directly.

SEARCH RULE: All core data (transit, weather, events, city buzz) is already provided below — do NOT search for any of it.
Run a search ONLY if the question asks for something not in the pre-fetched data (e.g. restaurants, specific venues, parking).
If you search: use fresh_search with one precise query (e.g. "best Italian restaurants North End Boston"). Read the summary it returns and use it directly — do NOT open individual links or run follow-up searches. One search maximum.

After your optional single search, immediately write your final answer. Choose the format based on what was asked:

FORMAT A — BROAD question ("what's happening tonight?", "give me a Boston update"):
🚇 **Transit**: [MBTA status, 1 sentence]
🌤️ **Weather**: [conditions, 1 sentence]
🎉 **Events Tonight**: [top event or game, 1 sentence]
📢 **City Buzz**: [one real Boston news story from today, 1 sentence]
💡 **Recommendation**: [one specific actionable tip]

FORMAT B — SPECIFIC question ("Is the Red Line running?", "Any games tonight?", "Will it rain?"):
Answer only what was asked in 1–3 sentences. No extra sections. No emoji headers.

RULES:
- No preamble, no "Here is your update"
- Be specific — exact line names, venue names, temperatures
- Max 100 words for specific, max 130 for full briefing
- Write your answer immediately — do not stop without writing it`;


import type { BostonLiveData } from "./boston-data";

function buildLiveDataBlock(data: BostonLiveData): string {
  return `--- LIVE BOSTON DATA (pre-fetched, use this directly) ---
🚇 MBTA Alerts:
${data.mbta}

🌤️ Weather:
${data.weather}

🎉 Events Today:
${data.events}

📢 City Buzz (top r/boston posts right now):
${data.buzz}
--- END LIVE DATA ---`;
}

/**
 * Flattens chat history + Boston system prompt into one instructions string.
 * Pass liveData to inject pre-fetched MBTA/weather/events context.
 */
export function buildInstructions(
  message: string,
  history?: ChatMessage[],
  liveData?: BostonLiveData,
): string {
  const dataBlock = liveData ? `\n\n${buildLiveDataBlock(liveData)}` : "";
  const base = `${SYSTEM_PROMPT}${dataBlock}`;

  if (!history?.length) {
    return `${base}\n\nUser query: ${message}`;
  }
  const conversation = history
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");
  return `${base}\n\n${conversation}\n\nUser: ${message}\n\nRespond to the user's latest message.`;
}

export interface ReasoningNode {
  title?: string;
  thought?: string;
  tooluse?: Array<{
    tool_name?: string;
    parameters?: Record<string, unknown>;
    tool_result?: unknown;
  }>;
  subtask?: ReasoningNode[];
  conclusion?: string;
}

export function extractToolCalls(reasoning?: ReasoningNode): ToolCallInfo[] {
  if (!reasoning) return [];
  const calls: ToolCallInfo[] = [];
  function traverse(node: ReasoningNode) {
    for (const tu of node.tooluse ?? []) {
      if (tu.tool_name) {
        calls.push({
          name: tu.tool_name,
          input: tu.parameters ?? {},
          output: tu.tool_result,
        });
      }
    }
    for (const sub of node.subtask ?? []) traverse(sub);
  }
  traverse(reasoning);
  return calls;
}
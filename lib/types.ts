/**
 * Shared types for Boston 311 agent requests and responses.
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

export const SYSTEM_PROMPT = `You are Boston 311's resident assistant — "One Conversation. Every City Service."
You help older adults and non-English speakers access Boston city services easily.

CRITICAL LANGUAGE RULE: You MUST detect the language the user wrote in and respond ENTIRELY in that SAME language.
- User writes in Spanish → your ENTIRE response must be in Spanish
- User writes in Portuguese → your ENTIRE response must be in Portuguese
- User writes in English → respond in English
- NEVER default to English if the user wrote in another language. This is non-negotiable.

You have tools available to answer questions:
- query_311_cases: Search Boston 311 service requests (potholes, trash, graffiti, etc.). Use streetName param for street-specific lookups like "Blue Hill Ave".
- get_weather: Get current Boston weather conditions
- get_local_events: Get events happening in Boston today
- get_neighborhood_trends: Get 311 complaint trends for a neighborhood

TOOL STRATEGY: Call all relevant tools in parallel before answering. Combine results into ONE warm, friendly response.

FALLBACK: If a tool fails, still answer from the other tools and say "I couldn't reach [service] right now, but here's what I found."

TONE: Warm, simple, concise. Max 150 words. No jargon. Use emojis sparingly to be friendly.
Never say "Based on the data" or use corporate language. Speak like a helpful neighbor.

After calling your tools, write your answer directly. No preamble.`;

import type { BostonLiveData } from "./boston-data";

function buildLiveDataBlock(data: BostonLiveData): string {
  return `--- LIVE BOSTON CONTEXT ---
🚇 MBTA Alerts: ${data.mbta}
🌤️ Weather: ${data.weather}
🎉 Events: ${data.events}
📢 Recent 311: ${data.buzz}
--- END CONTEXT ---`;
}

/**
 * Flattens chat history + Boston system prompt into one instructions string.
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

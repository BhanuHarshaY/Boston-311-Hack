import { NextRequest, NextResponse } from "next/server";
import {
  query311Cases,
  getWeatherTool,
  getLocalEventsTool,
  getNeighborhoodTrends,
} from "@/lib/boston-data";

// ── Tool Handlers ─────────────────────────────────────────────

const ALLOWED_EXPR = /^[0-9+\-*/().,%\s\^e]+$/i;

async function calculator(params: Record<string, unknown>) {
  const { expression } = params;
  if (!expression || typeof expression !== "string")
    return { error: "expression is required" };
  if (!ALLOWED_EXPR.test(expression))
    return { error: "Expression contains invalid characters" };
  const normalized = expression.replace(/\^/g, "**");
  const result = new Function(`"use strict"; return (${normalized})`)();
  if (typeof result !== "number" || !isFinite(result))
    return { error: "Expression did not produce a finite number" };
  return { result };
}

// ── Register handlers ─────────────────────────────────────────
const handlers: Record<
  string,
  (params: Record<string, unknown>) => Promise<Record<string, unknown>>
> = {
  // Boston 311 agent tools
  query_311_cases: (p) => query311Cases(p as Parameters<typeof query311Cases>[0]),
  get_weather: (p) => getWeatherTool(p as Parameters<typeof getWeatherTool>[0]),
  get_local_events: (p) => getLocalEventsTool(p as Parameters<typeof getLocalEventsTool>[0]),
  get_neighborhood_trends: (p) => getNeighborhoodTrends(p as Parameters<typeof getNeighborhoodTrends>[0]),
  // Legacy tools
  Calculator: calculator,
};

// ── Dispatcher ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tool_name, parameters, request_id } = body;
    console.log(`[tool:${tool_name}]`, { parameters, request_id });
    const handler = handlers[tool_name];
    if (!handler)
      return NextResponse.json({ error: `Unknown tool: ${tool_name}` }, { status: 400 });
    const result = await handler(parameters ?? {});
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tool execution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

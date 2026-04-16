import type { Tool } from "subconscious";

const TOOL_BASE_URL = process.env.APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export function getTools(): Tool[] {
  return [
    {
      type: "function",
      method: "POST",
      name: "query_311_cases",
      description: "Search Boston 311 service requests. Use to look up pothole status, trash pickup complaints, graffiti reports, and other city service cases. Can filter by neighborhood, case type, or specific case ID.",
      parameters: {
        type: "object",
        properties: {
          neighborhood: { type: "string", description: "Boston neighborhood name, e.g. 'Dorchester', 'Roxbury', 'South End'" },
          caseType: { type: "string", description: "Type of complaint, e.g. 'Pothole', 'Trash', 'Graffiti', 'Sidewalk'" },
          caseId: { type: "string", description: "Specific 311 case ID to look up" },
          streetName: { type: "string", description: "Street name to search, e.g. 'Blue Hill Ave', 'Washington St'" },
          limit: { type: "number", description: "Max results to return (default 10)" },
        },
      },
      url: `${TOOL_BASE_URL}/api/tools`,
    },
    {
      type: "function",
      method: "POST",
      name: "get_weather",
      description: "Get current Boston weather conditions including temperature, precipitation chance, and a plain-English summary. Use this when asked if it's a good day to go outside, about weather, rain, or outdoor activities.",
      parameters: {
        type: "object",
        properties: {
          lat: { type: "number", description: "Latitude (default: 42.36 for Boston)" },
          lon: { type: "number", description: "Longitude (default: -71.06 for Boston)" },
        },
      },
      url: `${TOOL_BASE_URL}/api/tools`,
    },
    {
      type: "function",
      method: "POST",
      name: "get_local_events",
      description: "Get events happening in Boston today including free events, markets, and community activities.",
      parameters: {
        type: "object",
        properties: {
          neighborhood: { type: "string", description: "Filter events near a specific neighborhood (optional)" },
        },
      },
      url: `${TOOL_BASE_URL}/api/tools`,
    },
    {
      type: "function",
      method: "POST",
      name: "get_neighborhood_trends",
      description: "Get 311 complaint trends for a Boston neighborhood over the last 30 days. Shows if issues are trending up or down and what the top complaint types are.",
      parameters: {
        type: "object",
        properties: {
          neighborhood: { type: "string", description: "Boston neighborhood name" },
          metric: { type: "string", description: "Metric type: 'all', 'potholes', 'trash', etc." },
        },
        required: ["neighborhood"],
      },
      url: `${TOOL_BASE_URL}/api/tools`,
    },
  ];
}

const TOOL_ICONS: Record<string, string> = {
  query_311_cases: "🏛️",
  get_weather: "☀️",
  get_local_events: "🎉",
  get_neighborhood_trends: "📈",
};

export function getToolIcon(toolName: string): string {
  return TOOL_ICONS[toolName] ?? "🔧";
}

export function getToolRegistry() {
  return getTools().map((tool) => {
    if (tool.type === "function")
      return { name: tool.name, description: tool.description, type: "self-hosted" as const };
    if (tool.type === "platform")
      return { name: tool.id, description: tool.id, type: "platform" as const };
    const host = new URL(tool.url).host;
    return { name: host, description: `MCP server at ${host}`, type: "mcp" as const };
  });
}

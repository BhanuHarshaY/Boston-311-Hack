import type { Tool } from "subconscious";

export function getTools(): Tool[] {
  return [
    // ── Platform tools (Subconscious built-in) ──────────────
    { type: "platform", id: "web_search", options: {} },
    { type: "platform", id: "tweet_search", options: {} },
    { type: "platform", id: "fresh_search", options: {} },
    { type: "platform", id: "news_search", options: {} },
  ];
}

export function getToolRegistry() {
  return getTools().map((tool) => {
    if (tool.type === "platform")
      return { name: tool.id, description: tool.id, type: "platform" as const };
    if (tool.type === "function")
      return { name: tool.name, description: tool.description, type: "self-hosted" as const };
    const host = new URL(tool.url).host;
    return { name: host, description: `MCP server at ${host}`, type: "mcp" as const };
  });
}
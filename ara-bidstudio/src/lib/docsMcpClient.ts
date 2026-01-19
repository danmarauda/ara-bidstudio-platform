// Lightweight client for the external Docs MCP server (template-docs-chatbot)
// Server URL can be configured via DOCS_MCP_URL env. Defaults to local dev.

const DEFAULT_URL = process.env.DOCS_MCP_URL || "http://localhost:4111";

async function mcpPost<T>(path: string, body: any): Promise<T> {
  const url = `${DEFAULT_URL.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // Note: These calls run server-side from Mastra tools.
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Docs MCP error ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export async function mcpPing(): Promise<{ status: string } | null> {
  try {
    const res = await fetch(`${DEFAULT_URL.replace(/\/$/, "")}/mcp`, { cache: "no-store" });
    if (!res.ok) return null;
    return { status: "ok" };
  } catch {
    return null;
  }
}

export async function mcpToolsList(): Promise<any> {
  return mcpPost("/mcp/message", { method: "tools/list", params: {} });
}

export async function mcpToolsCall(tool: string, args: any): Promise<any> {
  return mcpPost("/mcp/message", { method: "tools/call", params: { tool, args } });
}

// Convenience helpers mapped to likely MCP tools exposed by the template server.
export async function listDocs(): Promise<any> {
  return mcpToolsCall("listDocs", {});
}

export async function searchDocs(query: string): Promise<any> {
  return mcpToolsCall("searchDocs", { query });
}

export async function answerDocs(question: string): Promise<any> {
  return mcpToolsCall("answerDocs", { question });
}

export async function ingestDoc(doc: { title: string; content: string; tags?: string[] }): Promise<any> {
  return mcpToolsCall("ingestDoc", doc);
}


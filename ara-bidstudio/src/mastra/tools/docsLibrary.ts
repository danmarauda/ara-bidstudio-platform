import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { listDocs, searchDocs, answerDocs, ingestDoc } from "@/lib/docsMcpClient";

export const docsListTool = createTool({
  id: "docsList",
  description: "List documents in the external historical library (MCP server)",
  inputSchema: z.object({}),
  outputSchema: z.any(),
  execute: async () => {
    return await listDocs();
  },
});

export const docsSearchTool = createTool({
  id: "docsSearch",
  description: "Search the external historical library (MCP server)",
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.any(),
  execute: async ({ context }) => {
    const query = String((context as any)?.query ?? "");
    return await searchDocs(query);
  },
});

export const docsAnswerTool = createTool({
  id: "docsAnswer",
  description: "Answer a question using the external historical library (MCP server)",
  inputSchema: z.object({ question: z.string() }),
  outputSchema: z.any(),
  execute: async ({ context }) => {
    const question = String((context as any)?.question ?? "");
    return await answerDocs(question);
  },
});

export const docsIngestTool = createTool({
  id: "docsIngest",
  description: "Ingest a new document into the external historical library (if MCP server supports it)",
  inputSchema: z.object({
    title: z.string(),
    content: z.string(),
    tags: z.array(z.string()).optional(),
  }),
  outputSchema: z.any(),
  execute: async ({ context }) => {
    const { title, content, tags } = context as any;
    return await ingestDoc({ title, content, tags });
  },
});


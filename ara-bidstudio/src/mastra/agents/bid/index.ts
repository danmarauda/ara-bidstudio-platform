import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { AgentStateSchema } from "@/lib/state";
import { bidSystemPrompt } from "./systemPrompt";
import {
  ingestDocumentTool,
  answerQuestionTool,
  extractRequirementsTool,
  mapCapabilitiesTool,
  buildComplianceMatrixTool,
  generateEstimateTool,
  costSummaryTool,
  createSectionDraftTool,
  reviseSectionTool,
  proposeReviewChecklistTool,
  prepareSubmissionPackageTool,
} from "@/mastra/tools";
import { docsListTool, docsSearchTool, docsAnswerTool, docsIngestTool } from "@/mastra/tools";

const MODEL = process.env.MASTRA_MODEL || "gpt-4.1";

export const bidAgent = new Agent({
  name: "Bid Agent",
  tools: {
    ingestDocumentTool,
    answerQuestionTool,
    extractRequirementsTool,
    mapCapabilitiesTool,
    buildComplianceMatrixTool,
    generateEstimateTool,
    costSummaryTool,
    createSectionDraftTool,
    reviseSectionTool,
    proposeReviewChecklistTool,
    prepareSubmissionPackageTool,
    // Historical documents library (MCP-backed)
    docsListTool,
    docsSearchTool,
    docsAnswerTool,
    docsIngestTool,
  },
  model: openai(MODEL),
  instructions: bidSystemPrompt,
  memory: new Memory({
    storage: new LibSQLStore({ url: "file::memory:" }),
    options: {
      workingMemory: {
        enabled: true,
        schema: AgentStateSchema,
      },
    },
  }),
});

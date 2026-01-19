import { createTool } from "@mastra/core/tools";
import { z } from "zod";
export {
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
} from "@/mastra/tools/bid";

export {
  docsListTool,
  docsSearchTool,
  docsAnswerTool,
  docsIngestTool,
} from "@/mastra/tools/docsLibrary";

// Define the handler for the weather tool
const getWeatherInfo = async (location: string) => {
  console.log(`Fetching weather for ${location}...`);
  return { temperature: 20, conditions: "Sunny" };
};

// Demo tool for the starter app
export const weatherTool = createTool({
  id: "Get Weather Information",
  description: `Fetches the current weather information for a given city`,
  inputSchema: z.object({
    location: z.string().describe("Location name"),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    conditions: z.string(),
  }),
  execute: async ({ context: { location } }) => {
    return await getWeatherInfo(location);
  },
});

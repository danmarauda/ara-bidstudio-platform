
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { projectAssistantAgent } from './agents/project-assistant-agent';
import { codeReviewerAgent } from './agents/code-reviewer-agent';
import { projectOnboardingWorkflow } from './workflows/project-onboarding-workflow';
import { documentResearchWorkflow } from "./workflows/document-research-workflow";
import { simpleDemoWorkflow } from './workflows/simple-demo-workflow';

export const mastra = new Mastra({
  agents: { projectAssistantAgent, codeReviewerAgent },
  workflows: { projectOnboardingWorkflow, documentResearchWorkflow, simpleDemoWorkflow },
  storage: new LibSQLStore({
    // Use persistent file storage for telemetry, evals, and agent memory
    url: "file:./mastra.db",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});

import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { weatherAgent } from "./agents";
import { bidAgent } from "./agents/bid";
import { ConsoleLogger, LogLevel } from "@mastra/core/logger";

const LOG_LEVEL = process.env.LOG_LEVEL as LogLevel || "info";

export const mastra = new Mastra({
  agents: { 
    weatherAgent,
    bidAgent,
  },
  storage: new LibSQLStore({
    url: ":memory:"
  }),
  logger: new ConsoleLogger({
    level: LOG_LEVEL,
  }),
  telemetry: {
    serviceName: "ara-bidstudio",
    enabled: true,
    export: {
      type: "console", // Use console for development
    },
  },
});

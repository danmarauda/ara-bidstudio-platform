#!/usr/bin/env node
/**
 * Start external Docs MCP server (template-docs-chatbot) for local development.
 * - Uses DOCS_MCP_DIR env to locate the repo, or defaults to:
 *   /Users/alias/Documents/MastraExamples/template-docs-chatbot
 * - Runs: pnpm -C <DIR> dev:mcp
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const defaultDir = "/Users/alias/Documents/MastraExamples/template-docs-chatbot";
const repoDir = process.env.DOCS_MCP_DIR ? resolve(process.env.DOCS_MCP_DIR) : defaultDir;

if (!existsSync(repoDir)) {
  console.error(
    `Docs MCP repo not found at: ${repoDir}\n` +
      `Please clone it: git clone https://github.com/mastra-ai/template-docs-chatbot ${repoDir}\n` +
      `Or set DOCS_MCP_DIR to your local path.`
  );
  process.exit(1);
}

const proc = spawn("pnpm", ["-C", repoDir, "dev:mcp"], {
  stdio: "inherit",
  env: process.env,
});

proc.on("exit", (code, signal) => {
  if (signal) {
    console.error(`MCP server exited due to signal: ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 0);
});


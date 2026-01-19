/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminAuth from "../adminAuth.js";
import type * as adminExport from "../adminExport.js";
import type * as adminMetrics from "../adminMetrics.js";
import type * as agents from "../agents.js";
import type * as auth from "../auth.js";
import type * as authHelpers from "../authHelpers.js";
import type * as blockchainTransactions from "../blockchainTransactions.js";
import type * as chats from "../chats.js";
import type * as chatsAuth from "../chatsAuth.js";
import type * as cleanupAgents from "../cleanupAgents.js";
import type * as crons from "../crons.js";
import type * as documentProcessing from "../documentProcessing.js";
import type * as documents from "../documents.js";
import type * as embeddings from "../embeddings.js";
import type * as env from "../env.js";
import type * as executionTracking from "../executionTracking.js";
import type * as fileDocuments from "../fileDocuments.js";
import type * as fileProcessing from "../fileProcessing.js";
import type * as fileValidation from "../fileValidation.js";
import type * as files from "../files.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as httpAuth from "../httpAuth.js";
import type * as lib_agents_agentManager from "../lib/agents/agentManager.js";
import type * as lib_agents_anubisAgent from "../lib/agents/anubisAgent.js";
import type * as mcpIntegration from "../mcpIntegration.js";
import type * as mcpServerManager from "../mcpServerManager.js";
import type * as mcpServers from "../mcpServers.js";
import type * as memories from "../memories.js";
import type * as memoryExtraction from "../memoryExtraction.js";
import type * as messageRating from "../messageRating.js";
import type * as messages from "../messages.js";
import type * as messagesAuth from "../messagesAuth.js";
import type * as migrations_fixBlacklistedTokens from "../migrations/fixBlacklistedTokens.js";
import type * as migrations_fixChatOwnership from "../migrations/fixChatOwnership.js";
import type * as migrations_initializeTokenUsage from "../migrations/initializeTokenUsage.js";
import type * as migrations_optimizeAnubisTokenUsage from "../migrations/optimizeAnubisTokenUsage.js";
import type * as migrations_removeUpdatedAt from "../migrations/removeUpdatedAt.js";
import type * as migrations_updateDefaultAgents from "../migrations/updateDefaultAgents.js";
import type * as migrations_updateGeneralAssistantToAnubis from "../migrations/updateGeneralAssistantToAnubis.js";
import type * as migrations from "../migrations.js";
import type * as monitoring from "../monitoring.js";
import type * as paymentVerification from "../paymentVerification.js";
import type * as prompts from "../prompts.js";
import type * as rag from "../rag.js";
import type * as ragSecurity from "../ragSecurity.js";
import type * as referrals from "../referrals.js";
import type * as solanaPayouts from "../solanaPayouts.js";
import type * as splTokens from "../splTokens.js";
import type * as streaming from "../streaming.js";
import type * as subscriptionPayment from "../subscriptionPayment.js";
import type * as subscriptions from "../subscriptions.js";
import type * as tokenPrices from "../tokenPrices.js";
import type * as toolRegistry from "../toolRegistry.js";
import type * as toolRegistryHelpers from "../toolRegistryHelpers.js";
import type * as tools from "../tools.js";
import type * as types_chat from "../types/chat.js";
import type * as typing from "../typing.js";
import type * as userPreferences from "../userPreferences.js";
import type * as users from "../users.js";
import type * as utils_logger from "../utils/logger.js";
import type * as vectorSearch from "../vectorSearch.js";
import type * as vectorStoreFiles from "../vectorStoreFiles.js";
import type * as vectorStores from "../vectorStores.js";
import type * as workflows from "../workflows.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminAuth: typeof adminAuth;
  adminExport: typeof adminExport;
  adminMetrics: typeof adminMetrics;
  agents: typeof agents;
  auth: typeof auth;
  authHelpers: typeof authHelpers;
  blockchainTransactions: typeof blockchainTransactions;
  chats: typeof chats;
  chatsAuth: typeof chatsAuth;
  cleanupAgents: typeof cleanupAgents;
  crons: typeof crons;
  documentProcessing: typeof documentProcessing;
  documents: typeof documents;
  embeddings: typeof embeddings;
  env: typeof env;
  executionTracking: typeof executionTracking;
  fileDocuments: typeof fileDocuments;
  fileProcessing: typeof fileProcessing;
  fileValidation: typeof fileValidation;
  files: typeof files;
  healthCheck: typeof healthCheck;
  http: typeof http;
  httpAuth: typeof httpAuth;
  "lib/agents/agentManager": typeof lib_agents_agentManager;
  "lib/agents/anubisAgent": typeof lib_agents_anubisAgent;
  mcpIntegration: typeof mcpIntegration;
  mcpServerManager: typeof mcpServerManager;
  mcpServers: typeof mcpServers;
  memories: typeof memories;
  memoryExtraction: typeof memoryExtraction;
  messageRating: typeof messageRating;
  messages: typeof messages;
  messagesAuth: typeof messagesAuth;
  "migrations/fixBlacklistedTokens": typeof migrations_fixBlacklistedTokens;
  "migrations/fixChatOwnership": typeof migrations_fixChatOwnership;
  "migrations/initializeTokenUsage": typeof migrations_initializeTokenUsage;
  "migrations/optimizeAnubisTokenUsage": typeof migrations_optimizeAnubisTokenUsage;
  "migrations/removeUpdatedAt": typeof migrations_removeUpdatedAt;
  "migrations/updateDefaultAgents": typeof migrations_updateDefaultAgents;
  "migrations/updateGeneralAssistantToAnubis": typeof migrations_updateGeneralAssistantToAnubis;
  migrations: typeof migrations;
  monitoring: typeof monitoring;
  paymentVerification: typeof paymentVerification;
  prompts: typeof prompts;
  rag: typeof rag;
  ragSecurity: typeof ragSecurity;
  referrals: typeof referrals;
  solanaPayouts: typeof solanaPayouts;
  splTokens: typeof splTokens;
  streaming: typeof streaming;
  subscriptionPayment: typeof subscriptionPayment;
  subscriptions: typeof subscriptions;
  tokenPrices: typeof tokenPrices;
  toolRegistry: typeof toolRegistry;
  toolRegistryHelpers: typeof toolRegistryHelpers;
  tools: typeof tools;
  "types/chat": typeof types_chat;
  typing: typeof typing;
  userPreferences: typeof userPreferences;
  users: typeof users;
  "utils/logger": typeof utils_logger;
  vectorSearch: typeof vectorSearch;
  vectorStoreFiles: typeof vectorStoreFiles;
  vectorStores: typeof vectorStores;
  workflows: typeof workflows;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  persistentTextStreaming: {
    lib: {
      addChunk: FunctionReference<
        "mutation",
        "internal",
        { final: boolean; streamId: string; text: string },
        any
      >;
      createStream: FunctionReference<"mutation", "internal", {}, any>;
      getStreamStatus: FunctionReference<
        "query",
        "internal",
        { streamId: string },
        "pending" | "streaming" | "done" | "error" | "timeout"
      >;
      getStreamText: FunctionReference<
        "query",
        "internal",
        { streamId: string },
        {
          status: "pending" | "streaming" | "done" | "error" | "timeout";
          text: string;
        }
      >;
      setStreamStatus: FunctionReference<
        "mutation",
        "internal",
        {
          status: "pending" | "streaming" | "done" | "error" | "timeout";
          streamId: string;
        },
        any
      >;
    };
  };
};

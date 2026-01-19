import { z } from "zod";
import { UserSchema, TaskSchema } from "@/lib/types";

// Bid-specific schemas
const DocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().optional(),
  uploadedAt: z.number().optional(),
});

const RequirementSchema = z.object({
  id: z.string(),
  text: z.string(),
  category: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
});

const ComplianceItemSchema = z.object({
  requirementId: z.string(),
  status: z.enum(["meets", "partial", "gap"]),
  note: z.string().optional(),
  evidenceRequired: z.string().optional(),
});

const EstimateItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().optional(),
  cost: z.number(),
  unit: z.string().optional(),
  quantity: z.number().optional(),
});

const DraftSectionSchema = z.object({
  section: z.string(),
  content: z.string(),
  status: z.enum(["draft", "review", "approved"]).optional(),
  lastModified: z.number().optional(),
});

const ChecklistItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  status: z.enum(["todo", "done"]),
  category: z.string().optional(),
});

export const AgentStateSchema = z.object({
  // Project context
  projectName: z.string(),
  projectDescription: z.string(),
  users: z.array(UserSchema),
  tasks: z.array(TaskSchema),
  
  // Tenant and bid context
  tenantSlug: z.string().default("ara-property-services"),
  projectId: z.string().optional(),
  tenderId: z.string().optional(),
  tenderName: z.string().optional(),
  
  // Bid workflow data
  documents: z.array(DocumentSchema).default([]),
  requirements: z.array(RequirementSchema).default([]),
  complianceItems: z.array(ComplianceItemSchema).default([]),
  estimateItems: z.array(EstimateItemSchema).default([]),
  drafts: z.array(DraftSectionSchema).default([]),
  checklist: z.array(ChecklistItemSchema).default([]),
  
  // Progress tracking
  hasIngestedDocs: z.boolean().default(false),
  requirementsExtracted: z.boolean().default(false),
  complianceAnalyzed: z.boolean().default(false),
  estimateReady: z.boolean().default(false),
  draftsCompleted: z.boolean().default(false),
  submissionPrepared: z.boolean().default(false),
  
  // Current workflow step
  currentStep: z.enum([
    "setup",
    "ingest", 
    "analyze",
    "estimate",
    "draft",
    "review", 
    "submit"
  ]).default("setup"),
});

export type AgentState = z.infer<typeof AgentStateSchema>;

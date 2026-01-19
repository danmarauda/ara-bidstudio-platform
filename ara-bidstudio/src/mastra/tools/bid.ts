import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { DEFAULT_TENANT } from "@/lib/tenant";
import { ensureTenant, addRequirements, addComplianceItems, addEstimationItems, upsertDraft, createSubmission } from "@/lib/store";
import { ingestDocumentContent, searchChunks } from "@/lib/doc";
import { composeAnswerFromContext } from "@/lib/llm";
import { seedARA } from "@/lib/seed";

export const ingestDocumentTool = createTool({
  id: "ingestDocument",
  description: "Ingest and parse a tender-related document (stub)",
  inputSchema: z.object({
    tenant: z.string().optional(),
    projectId: z.string().optional(),
    filename: z.string(),
    mimeType: z.string().optional(),
    content: z.string().describe("Document text or base64 content"),
  }),
  outputSchema: z.object({
    status: z.literal("ok"),
    documentId: z.string().optional(),
    tokens: z.number().optional(),
  }),
  execute: async ({ context }: { context: Record<string, unknown> }) => {
    seedARA();
    const tenantSlug = (context.tenant as string) || DEFAULT_TENANT;
    const tenant = await ensureTenant(tenantSlug);
    const projectId = (context.projectId as string) || seedARA().projectId;
    const filename = context.filename as string;
    const mimeType = context.mimeType as string | undefined;
    const content = context.content as string | undefined;
    const ing = await ingestDocumentContent({ tenantId: tenant.id, projectId, filename, mimeType, content: content || "" });
    return { status: "ok" as const, documentId: ing.documentId };
  },
});

export const answerQuestionTool = createTool({
  id: "answerQuestion",
  description: "Answer a question using tenant/project context (stub)",
  inputSchema: z.object({
    tenant: z.string().optional(),
    projectId: z.string().optional(),
    question: z.string(),
  }),
  outputSchema: z.object({ answer: z.string(), context: z.array(z.object({ documentId: z.string(), index: z.number(), text: z.string() })).optional() }),
  execute: async ({ context }: { context: Record<string, unknown> }) => {
    const tenantSlug = (context.tenant as string) || DEFAULT_TENANT;
    const tenant = await ensureTenant(tenantSlug);
    const projectId = (context.projectId as string) || undefined;
    const question = context.question as string;
    const chunks = await searchChunks({ tenantId: tenant.id, projectId, query: question, topK: 3 });
    let answer: string;
    if (chunks.length) {
      const passages = chunks.map((c) => c.text.substring(0, 1000));
      const composed = await composeAnswerFromContext(question, passages);
      answer = composed || `Top relevant passages:\n\n${passages.map((p) => `- ${p}`).join("\n\n")}`;
    } else {
      answer = "No relevant passages found yet. Try ingesting documents.";
    }
    return { answer, context: chunks.map((c) => ({ documentId: c.documentId, index: c.index, text: c.text })) };
  },
});

export const extractRequirementsTool = createTool({
  id: "extractRequirements",
  description: "Extract structured requirements from documents (stub)",
  inputSchema: z.object({
    tenant: z.string().optional(),
    tenderId: z.string().optional(),
    documentIds: z.array(z.string()).optional(),
    content: z.string().optional(),
  }),
  outputSchema: z.object({
    requirements: z.array(z.object({ id: z.string(), text: z.string(), category: z.string().optional() })),
  }),
  execute: async ({ context }: { context: Record<string, unknown> }) => {
    seedARA();
    const tenantSlug = (context.tenant as string) || DEFAULT_TENANT;
    const tenant = await ensureTenant(tenantSlug);
    const tenderId = (context.tenderId as string) || seedARA().tenderId;
    const created = await addRequirements(tenant.id, tenderId, [
      { text: "Provide daily cleaning services", category: "Scope" },
    ]);
    return { requirements: created.map(r => ({ id: r.id, text: r.text, category: r.category })) };
  },
});

export const mapCapabilitiesTool = createTool({
  id: "mapCapabilities",
  description: "Map requirements to organizational capabilities (stub)",
  inputSchema: z.object({
    requirements: z.array(z.object({ id: z.string(), text: z.string() })),
  }),
  outputSchema: z.object({
    mappings: z.array(z.object({ requirementId: z.string(), capability: z.string(), coverage: z.number() })),
  }),
  execute: async ({ context }) => {
    void context;
    return { mappings: [{ requirementId: "req-1", capability: "Day porter staffing", coverage: 0.9 }] };
  },
});

export const buildComplianceMatrixTool = createTool({
  id: "buildComplianceMatrix",
  description: "Generate a compliance matrix with gap analysis (stub)",
  inputSchema: z.object({
    tenant: z.string().optional(),
    tenderId: z.string().optional(),
    requirements: z.array(z.object({ id: z.string(), text: z.string() })),
  }),
  outputSchema: z.object({
    items: z.array(z.object({ requirementId: z.string(), status: z.enum(["meets", "partial", "gap"]), note: z.string().optional() })),
  }),
  execute: async ({ context }: { context: Record<string, unknown> }) => {
    seedARA();
    const tenantSlug = (context.tenant as string) || DEFAULT_TENANT;
    const tenant = await ensureTenant(tenantSlug);
    const tenderId = (context.tenderId as string) || seedARA().tenderId;
    const items = [{ requirementId: "req-1", status: "meets" as const }];
    await addComplianceItems(tenant.id, tenderId, items.map(i => ({ requirementId: i.requirementId, status: i.status })));
    return { items };
  },
});

export const generateEstimateTool = createTool({
  id: "generateEstimate",
  description: "Generate a cost estimate (stub)",
  inputSchema: z.object({
    tenant: z.string().optional(),
    tenderId: z.string().optional(),
    scope: z.string(),
  }),
  outputSchema: z.object({
    items: z.array(z.object({ id: z.string(), name: z.string(), cost: z.number() })),
  }),
  execute: async ({ context }: { context: Record<string, unknown> }) => {
    seedARA();
    const tenantSlug = (context.tenant as string) || DEFAULT_TENANT;
    const tenant = await ensureTenant(tenantSlug);
    const tenderId = (context.tenderId as string) || seedARA().tenderId;
    const created = await addEstimationItems(tenant.id, tenderId, [{ name: "Labor - Daily cleaning", cost: 12000 }]);
    return { items: created.map(i => ({ id: i.id, name: i.name, cost: i.cost })) };
  },
});

export const costSummaryTool = createTool({
  id: "costSummary",
  description: "Summarize estimate totals (stub)",
  inputSchema: z.object({
    items: z.array(z.object({ id: z.string(), name: z.string(), cost: z.number() })),
  }),
  outputSchema: z.object({ total: z.number() }),
  execute: async ({ context }: { context: { items?: { id: string; name: string; cost: number }[] } }) => {
    const items = context.items || [];
    const total = items.reduce((acc, it) => acc + (it.cost || 0), 0);
    return { total };
  },
});

export const createSectionDraftTool = createTool({
  id: "createSectionDraft",
  description: "Create a draft for a proposal section (stub)",
  inputSchema: z.object({
    tenant: z.string().optional(),
    tenderId: z.string().optional(),
    section: z.string(),
    outline: z.array(z.string()).optional(),
  }),
  outputSchema: z.object({ section: z.string(), content: z.string() }),
  execute: async ({ context }: { context: Record<string, unknown> }) => {
    seedARA();
    const tenantSlug = (context.tenant as string) || DEFAULT_TENANT;
    const tenant = await ensureTenant(tenantSlug);
    const tenderId = (context.tenderId as string) || seedARA().tenderId;
    const section = (context.section as string) || "Section";
    const draft = await upsertDraft(tenant.id, tenderId, section, `Draft content for ${section}...`);
    return { section: draft.section, content: draft.content };
  },
});

export const reviseSectionTool = createTool({
  id: "reviseSection",
  description: "Revise an existing section draft (stub)",
  inputSchema: z.object({
    tenant: z.string().optional(),
    tenderId: z.string().optional(),
    section: z.string(),
    instructions: z.string(),
  }),
  outputSchema: z.object({ section: z.string(), content: z.string() }),
  execute: async ({ context }: { context: Record<string, unknown> }) => {
    seedARA();
    const tenantSlug = (context.tenant as string) || DEFAULT_TENANT;
    const tenant = await ensureTenant(tenantSlug);
    const tenderId = (context.tenderId as string) || seedARA().tenderId;
    const section = (context.section as string) || "Section";
    const draft = await upsertDraft(tenant.id, tenderId, section, `Revised draft for ${section}.`);
    return { section: draft.section, content: draft.content };
  },
});

export const proposeReviewChecklistTool = createTool({
  id: "proposeReviewChecklist",
  description: "Propose a review checklist (stub)",
  inputSchema: z.object({
    scope: z.string().optional(),
  }),
  outputSchema: z.object({
    checklist: z.array(z.object({ id: z.string(), text: z.string(), status: z.enum(["todo", "done"]).default("todo") })),
  }),
  execute: async () => {
    return { checklist: [{ id: "chk-1", text: "Verify compliance matrix is complete", status: "todo" as const }] };
  },
});

export const prepareSubmissionPackageTool = createTool({
  id: "prepareSubmissionPackage",
  description: "Prepare a final submission package (stub)",
  inputSchema: z.object({
    tenant: z.string().optional(),
    tenderId: z.string().optional(),
  }),
  outputSchema: z.object({
    files: z.array(z.object({ name: z.string(), path: z.string() })),
  }),
  execute: async ({ context }: { context: Record<string, unknown> }) => {
    seedARA();
    const tenantSlug = (context.tenant as string) || DEFAULT_TENANT;
    const tenant = await ensureTenant(tenantSlug);
    const tenderId = (context.tenderId as string) || seedARA().tenderId;
    const files = [{ name: "proposal.pdf", path: "/tmp/proposal.pdf" }];
    await createSubmission(tenant.id, tenderId, files);
    return { files };
  },
});

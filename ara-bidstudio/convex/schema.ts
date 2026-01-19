import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tenants: defineTable({ slug: v.string(), name: v.string() }).index("by_slug", ["slug"]),
  projects: defineTable({ tenantId: v.string(), name: v.string(), description: v.optional(v.string()) }).index("by_tenant", ["tenantId"]),
  tenders: defineTable({ tenantId: v.string(), projectId: v.string(), name: v.string(), status: v.string() }).index("by_project", ["projectId"]).index("by_tenant", ["tenantId"]),
  documents: defineTable({ tenantId: v.string(), projectId: v.string(), name: v.string(), mimeType: v.optional(v.string()), content: v.optional(v.string()), createdAt: v.number() }).index("by_project", ["tenantId", "projectId"]).index("by_tenant", ["tenantId"]),
  doc_chunks: defineTable({ tenantId: v.string(), projectId: v.string(), documentId: v.string(), idx: v.number(), text: v.string(), embedding: v.optional(v.array(v.number())) }).index("by_project", ["tenantId", "projectId"]).index("by_tenant", ["tenantId"]).index("by_document", ["documentId", "idx"]),
  requirements: defineTable({ tenantId: v.string(), tenderId: v.string(), text: v.string(), category: v.optional(v.string()) }).index("by_tender", ["tenderId"]).index("by_tenant", ["tenantId"]),
  compliance: defineTable({ tenantId: v.string(), tenderId: v.string(), requirementId: v.string(), status: v.string(), note: v.optional(v.string()) }).index("by_tender", ["tenderId"]).index("by_tenant", ["tenantId"]),
  estimation: defineTable({ tenantId: v.string(), tenderId: v.string(), name: v.string(), cost: v.number() }).index("by_tender", ["tenderId"]).index("by_tenant", ["tenantId"]),
  drafts: defineTable({ tenantId: v.string(), tenderId: v.string(), section: v.string(), content: v.string() }).index("by_section", ["tenantId", "tenderId", "section"]).index("by_tenant", ["tenantId"]),
  submissions: defineTable({ tenantId: v.string(), tenderId: v.string(), files: v.array(v.object({ name: v.string(), path: v.string() })), createdAt: v.number() }).index("by_tender", ["tenderId"]).index("by_tenant", ["tenantId"]),
});


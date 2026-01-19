import { defineTable } from "convex/server";
import { v } from "convex/values";

export default {
  tables: {
    corpuses: defineTable({
      name: v.string(),
      description: v.string(),
      userId: v.string(),
      organizationId: v.string(),
      createdAt: v.string(),
      updatedAt: v.string(),
    })
      .index("by_user", ["userId"])
      .index("by_organization", ["organizationId"]),
    
    corpusDocuments: defineTable({
      corpusId: v.id("corpuses"),
      documentId: v.id("documents"),
      addedAt: v.string(),
    })
      .index("by_corpus", ["corpusId"])
      .index("by_document", ["documentId"]),
  },
};
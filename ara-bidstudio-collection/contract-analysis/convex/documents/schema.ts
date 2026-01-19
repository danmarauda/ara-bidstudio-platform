import { defineTable } from "convex/server";
import { v } from "convex/values";

export default {
  tables: {
    documents: defineTable({
      title: v.string(),
      description: v.string(),
      fileName: v.string(),
      fileSize: v.number(),
      page_count: v.number(),
      userId: v.string(),
      organizationId: v.string(),
      createdAt: v.string(),
      updatedAt: v.string(),
    })
      .index("by_user", ["userId"])
      .index("by_organization", ["organizationId"]),
  },
};
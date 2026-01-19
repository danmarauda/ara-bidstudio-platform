import { defineTable } from "convex/server";
import { v } from "convex/values";

export default {
  tables: {
    annotations: defineTable({
      documentId: v.id("documents"),
      page: v.number(),
      type: v.string(),
      label: v.string(),
      color: v.string(),
      boundingBox: v.object({
        x: v.number(),
        y: v.number(),
        width: v.number(),
        height: v.number(),
      }),
      userId: v.string(),
      createdAt: v.string(),
      updatedAt: v.string(),
    }).index("by_document", ["documentId"]),
  },
};
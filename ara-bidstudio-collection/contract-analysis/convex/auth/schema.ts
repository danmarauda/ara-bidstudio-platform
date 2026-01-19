import { defineTable } from "convex/server";
import { v } from "convex/values";

export default {
  tables: {
    users: defineTable({
      email: v.string(),
      name: v.string(),
      workosId: v.string(),
      organizationId: v.string(),
      createdAt: v.string(),
      updatedAt: v.string(),
    })
      .index("by_email", ["email"])
      .index("by_workos_id", ["workosId"]),
    
    organizations: defineTable({
      name: v.string(),
      workosId: v.string(),
      createdAt: v.string(),
      updatedAt: v.string(),
    }).index("by_workos_id", ["workosId"]),
    
    sessions: defineTable({
      userId: v.id("users"),
      token: v.string(),
      expiresAt: v.string(),
      createdAt: v.string(),
    })
      .index("by_token", ["token"])
      .index("by_user_id", ["userId"]),
  },
};
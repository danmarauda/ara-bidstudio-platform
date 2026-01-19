import { query } from "../_generated/server";
import { v } from "convex/values";

export const getDocuments = query({
  args: {
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Fetch documents for the organization or user
    const identity = await ctx.auth.getUserIdentity();
    const documents = await ctx.db.query("documents")
      .filter(args.organizationId ? 
        (q) => q.eq("organizationId", args.organizationId) : 
        (q) => q.eq("userId", identity?.subject || "anonymous"))
      .order("desc")
      .collect();
      
    return documents;
  },
});

export const getDocument = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    // Fetch a specific document by ID
    const document = await ctx.db.get(args.documentId);
    return document;
  },
});
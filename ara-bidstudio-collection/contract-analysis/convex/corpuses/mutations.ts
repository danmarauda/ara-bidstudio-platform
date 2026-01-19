import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createCorpus = mutation({
  args: {
    name: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const corpusId = await ctx.db.insert("corpuses", {
      name: args.name,
      description: args.description,
      userId: identity?.subject || "anonymous",
      organizationId: "default", // This would be dynamic in a real implementation
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    return corpusId;
  },
});

export const addDocumentToCorpus = mutation({
  args: {
    corpusId: v.id("corpuses"),
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const corpusDocumentId = await ctx.db.insert("corpusDocuments", {
      corpusId: args.corpusId,
      documentId: args.documentId,
      addedAt: new Date().toISOString(),
    });
    
    // Update corpus updatedAt timestamp
    await ctx.db.patch(args.corpusId, {
      updatedAt: new Date().toISOString(),
    });
    
    return corpusDocumentId;
  },
});

export const removeDocumentFromCorpus = mutation({
  args: {
    corpusId: v.id("corpuses"),
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    // Find and delete the corpusDocument relationship
    const corpusDocuments = await ctx.db.query("corpusDocuments")
      .filter((q) => 
        q.and(
          q.eq(q.field("corpusId"), args.corpusId),
          q.eq(q.field("documentId"), args.documentId)
        )
      )
      .collect();
      
    for (const corpusDocument of corpusDocuments) {
      await ctx.db.delete(corpusDocument._id);
    }
    
    // Update corpus updatedAt timestamp
    await ctx.db.patch(args.corpusId, {
      updatedAt: new Date().toISOString(),
    });
    
    return true;
  },
});
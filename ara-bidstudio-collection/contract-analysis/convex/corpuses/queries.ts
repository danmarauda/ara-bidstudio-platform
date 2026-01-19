import { query } from "../_generated/server";
import { v } from "convex/values";

export const getCorpuses = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const corpuses = await ctx.db.query("corpuses")
      .filter((q) => q.eq("userId", identity?.subject || "anonymous"))
      .order("desc")
      .collect();
      
    return corpuses;
  },
});

export const getCorpus = query({
  args: {
    corpusId: v.id("corpuses"),
  },
  handler: async (ctx, args) => {
    const corpus = await ctx.db.get(args.corpusId);
    return corpus;
  },
});

export const getCorpusDocuments = query({
  args: {
    corpusId: v.id("corpuses"),
  },
  handler: async (ctx, args) => {
    // Get all documents in a corpus
    const corpusDocuments = await ctx.db.query("corpusDocuments")
      .filter((q) => q.eq(q.field("corpusId"), args.corpusId))
      .collect();
      
    // Fetch the actual document data
    const documents = [];
    for (const corpusDocument of corpusDocuments) {
      const document = await ctx.db.get(corpusDocument.documentId);
      if (document) {
        documents.push(document);
      }
    }
    
    return documents;
  },
});
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getAnnotations = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const annotations = await ctx.db.query("annotations")
      .filter((q) => q.eq(q.field("documentId"), args.documentId))
      .collect();
      
    return annotations;
  },
});

export const getAnnotation = query({
  args: {
    annotationId: v.id("annotations"),
  },
  handler: async (ctx, args) => {
    const annotation = await ctx.db.get(args.annotationId);
    return annotation;
  },
});
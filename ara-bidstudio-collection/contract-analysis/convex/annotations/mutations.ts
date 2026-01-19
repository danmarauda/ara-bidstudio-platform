import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createAnnotation = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const annotationId = await ctx.db.insert("annotations", {
      documentId: args.documentId,
      page: args.page,
      type: args.type,
      label: args.label,
      color: args.color,
      boundingBox: args.boundingBox,
      userId: identity?.subject || "anonymous",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    return annotationId;
  },
});

export const deleteAnnotation = mutation({
  args: {
    annotationId: v.id("annotations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.annotationId);
    return true;
  },
});
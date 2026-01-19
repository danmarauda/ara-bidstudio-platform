import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const uploadDocument = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    page_count: v.number(),
    fileData: v.string(), // base64 encoded file data
  },
  handler: async (ctx, args) => {
    // Store document metadata in Convex database
    const identity = await ctx.auth.getUserIdentity();
    const documentId = await ctx.db.insert("documents", {
      title: args.title,
      description: args.description,
      fileName: args.fileName,
      fileSize: args.fileSize,
      page_count: args.page_count,
      userId: identity?.subject || "anonymous",
      organizationId: "default", // This would be dynamic in a real implementation
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // In a real implementation, this would call the docling-granite microservice
    // via HTTP request and process the base64 file data
    // For now, we'll just return the document ID
    return documentId;
  },
});
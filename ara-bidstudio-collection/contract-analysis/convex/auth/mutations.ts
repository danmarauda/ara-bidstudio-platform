import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    workosId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db.query("users")
      .filter((q) => q.eq("workosId", args.workosId))
      .first();
      
    if (existingUser) {
      return existingUser._id;
    }
    
    // Create new user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      workosId: args.workosId,
      organizationId: "default",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    return userId;
  },
});

export const createSession = mutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("sessions", {
      userId: args.userId,
      token: args.token,
      expiresAt: args.expiresAt,
      createdAt: new Date().toISOString(),
    });
    
    return sessionId;
  },
});

export const deleteSession = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db.query("sessions")
      .filter((q) => q.eq("token", args.token))
      .collect();
      
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }
    
    return true;
  },
});
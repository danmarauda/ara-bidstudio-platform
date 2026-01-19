import { query } from "../_generated/server";
import { v } from "convex/values";

export const getUser = query({
  args: {
    workosId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users")
      .filter((q) => q.eq("workosId", args.workosId))
      .first();
      
    return user;
  },
});

export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users")
      .filter((q) => q.eq("email", args.email.toLowerCase()))
      .first();
      
    return user;
  },
});

export const getSession = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.query("sessions")
      .filter((q) => q.eq("token", args.token))
      .first();
      
    return session;
  },
});

export const getUserBySessionToken = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.query("sessions")
      .filter((q) => q.eq("token", args.sessionToken))
      .first();
      
    if (!session) {
      return null;
    }
    
    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      return null;
    }
    
    const user = await ctx.db.get(session.userId);
    return user;
  },
});
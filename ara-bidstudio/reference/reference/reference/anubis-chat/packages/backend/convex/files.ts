/**
 * File Management Functions
 * Handles file uploads, storage, and retrieval with subscription tier limits
 */

import { ConvexError, v } from 'convex/values';
import { api } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { httpAction, mutation, query } from './_generated/server';
import { getCurrentUser } from './authHelpers';
import { checkUploadLimits, TIER_FILE_LIMITS } from './fileValidation';

// =============================================================================
// Queries
// =============================================================================

/**
 * List files for a wallet address
 */
export const list = query({
  args: {
    walletAddress: v.string(),
    purpose: v.optional(
      v.union(
        v.literal('assistants'),
        v.literal('vision'),
        v.literal('batch'),
        v.literal('fine-tune')
      )
    ),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { walletAddress, purpose, limit = 20, cursor } = args;

    // Build query
    let dbQuery = ctx.db
      .query('files')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', walletAddress));

    // Filter by purpose if specified
    if (purpose) {
      dbQuery = dbQuery.filter((q) => q.eq(q.field('purpose'), purpose));
    }

    // Apply cursor if provided
    if (cursor) {
      try {
        const cursorId = cursor as Id<'files'>;
        const cursorDoc = await ctx.db.get(cursorId);
        if (cursorDoc) {
          dbQuery = dbQuery.filter((q) =>
            q.lt(q.field('createdAt'), cursorDoc.createdAt)
          );
        }
      } catch (_error) {
        // ignore invalid cursor
      }
    }

    // Fetch items with limit + 1 to check for more
    const items = await dbQuery.order('desc').take(limit + 1);

    // Check if there are more items
    const hasMore = items.length > limit;
    const returnItems = hasMore ? items.slice(0, limit) : items;

    // Get next cursor
    const nextCursor = hasMore ? returnItems.at(-1)?._id : undefined;

    return {
      items: returnItems,
      hasMore,
      nextCursor,
    };
  },
});

/**
 * Get a specific file
 */
export const get = query({
  args: {
    fileId: v.string(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const { fileId, walletAddress } = args;

    const file = await ctx.db
      .query('files')
      .withIndex('by_fileId', (q) => q.eq('fileId', fileId))
      .first();

    // Check ownership
    if (!file || file.walletAddress !== walletAddress) {
      return null;
    }

    return file;
  },
});

/**
 * Get file content (base64 encoded)
 */
export const getContent = query({
  args: {
    fileId: v.string(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const { fileId, walletAddress } = args;

    const file = await ctx.db
      .query('files')
      .withIndex('by_fileId', (q) => q.eq('fileId', fileId))
      .first();

    // Check ownership
    if (!file || file.walletAddress !== walletAddress) {
      throw new ConvexError('File not found or access denied');
    }

    // Prefer streaming from storage via URL; fall back to base64
    const url = file.storageId
      ? await ctx.storage.getUrl(file.storageId as Id<'_storage'>)
      : undefined;

    return {
      fileId: file.fileId,
      fileName: file.fileName,
      mimeType: file.mimeType,
      data: file.data,
      url: url ?? file.url,
    } as const;
  },
});

// =============================================================================
// Mutations
// =============================================================================

/**
 * Upload a new file with tier-based validation
 */
export const upload = mutation({
  args: {
    walletAddress: v.string(),
    fileId: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    size: v.number(),
    hash: v.string(),
    // Prefer storage-first uploads; allow either storageId or legacy base64 data
    storageId: v.optional(v.string()),
    data: v.optional(v.string()), // Base64 encoded (legacy)
    purpose: v.union(
      v.literal('assistants'),
      v.literal('vision'),
      v.literal('batch'),
      v.literal('fine-tune')
    ),
    description: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get user and subscription info for tier-based validation
    const user = await getCurrentUser(ctx);
    if (!user || user.walletAddress !== args.walletAddress) {
      throw new ConvexError('Unauthorized');
    }

    const userTier = user.subscription?.tier || 'free';

    // Check upload limits based on subscription tier
    const uploadCheck = await checkUploadLimits(
      ctx,
      args.walletAddress,
      userTier as keyof typeof TIER_FILE_LIMITS,
      args.size
    );

    if (!uploadCheck.canUpload) {
      throw new ConvexError(uploadCheck.error || 'Upload not allowed');
    }

    // Check if file with same hash already exists for this user
    const existingFile = await ctx.db
      .query('files')
      .withIndex('by_hash', (q) =>
        q.eq('hash', args.hash).eq('walletAddress', args.walletAddress)
      )
      .first();

    if (existingFile) {
      // Return existing file instead of creating duplicate
      return existingFile;
    }

    // Resolve a public URL if storageId provided
    let resolvedUrl: string | undefined;
    if (args.storageId) {
      try {
        const url = await ctx.storage.getUrl(args.storageId as Id<'_storage'>);
        if (url) {
          resolvedUrl = url;
        }
      } catch (_err) {
        // ignore url resolution failure
      }
    }

    // Create file record
    const fileDoc = await ctx.db.insert('files', {
      walletAddress: args.walletAddress,
      fileId: args.fileId,
      fileName: args.fileName,
      mimeType: args.mimeType,
      size: args.size,
      hash: args.hash,
      data: args.data,
      storageId: args.storageId,
      url: resolvedUrl,
      purpose: args.purpose,
      description: args.description,
      tags: args.tags,
      status: 'processed',
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(fileDoc);
  },
});

/**
 * Update file metadata
 */
export const updateMetadata = mutation({
  args: {
    fileId: v.string(),
    walletAddress: v.string(),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    purpose: v.optional(
      v.union(
        v.literal('assistants'),
        v.literal('vision'),
        v.literal('batch'),
        v.literal('fine-tune')
      )
    ),
    storageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { fileId, walletAddress, ...updates } = args;

    // Get existing file
    const file = await ctx.db
      .query('files')
      .withIndex('by_fileId', (q) => q.eq('fileId', fileId))
      .first();

    // Check ownership
    if (!file || file.walletAddress !== walletAddress) {
      throw new ConvexError('File not found or access denied');
    }

    // If storageId is provided, attempt URL resolution
    const patch: Record<string, unknown> = {
      ...updates,
      updatedAt: Date.now(),
    };
    if (updates.storageId) {
      try {
        const url = await ctx.storage.getUrl(
          updates.storageId as Id<'_storage'>
        );
        if (url) {
          patch.url = url;
        }
      } catch (_e) {}
    }

    // Update file
    await ctx.db.patch(file._id, patch);
  },
});

/**
 * Delete a file
 */
export const deleteFile = mutation({
  args: {
    fileId: v.string(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const { fileId, walletAddress } = args;

    // Get existing file
    const file = await ctx.db
      .query('files')
      .withIndex('by_fileId', (q) => q.eq('fileId', fileId))
      .first();

    // Check ownership
    if (!file || file.walletAddress !== walletAddress) {
      throw new ConvexError('File not found or access denied');
    }

    // Remove file associations from vector stores
    const vectorStoreFiles = await ctx.db
      .query('vectorStoreFiles')
      .withIndex('by_file', (q) => q.eq('fileId', fileId))
      .collect();

    await Promise.all(vectorStoreFiles.map((f) => ctx.db.delete(f._id)));

    // Delete the file
    await ctx.db.delete(file._id);

    return { deleted: true, fileId };
  },
});

/**
 * Get file statistics for a user with tier limits
 */
export const getStats = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user to determine tier limits
    const user = await getCurrentUser(ctx);
    if (!user || user.walletAddress !== args.walletAddress) {
      throw new ConvexError('Unauthorized');
    }

    const userTier = user.subscription?.tier || 'free';
    const tierLimit =
      TIER_FILE_LIMITS[userTier as keyof typeof TIER_FILE_LIMITS];

    const files = await ctx.db
      .query('files')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', args.walletAddress))
      .collect();

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const filesThisMonth = files.filter(
      (file) => file.createdAt > thirtyDaysAgo
    ).length;

    const byPurpose = files.reduce(
      (acc, file) => {
        acc[file.purpose] = (acc[file.purpose] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byType = files.reduce(
      (acc, file) => {
        const type = file.mimeType.split('/')[0];
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate tier-specific limits and remaining capacity
    let limits = null;
    let remaining = null;

    if (userTier !== 'free' && typeof tierLimit === 'object') {
      limits = {
        maxFileSize: tierLimit.maxFileSize,
        totalStorageLimit: tierLimit.totalStorageLimit,
        maxFilesPerMonth: tierLimit.maxFilesPerMonth,
      };

      remaining = {
        storage: Math.max(0, tierLimit.totalStorageLimit - totalSize),
        filesThisMonth: Math.max(
          0,
          tierLimit.maxFilesPerMonth - filesThisMonth
        ),
      };
    }

    return {
      totalFiles: files.length,
      totalSize,
      filesThisMonth,
      averageSize: files.length > 0 ? totalSize / files.length : 0,
      byPurpose,
      byType,
      tier: userTier,
      limits,
      remaining,
      recentUploads: files
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5)
        .map((f) => ({
          fileId: f.fileId,
          fileName: f.fileName,
          size: f.size,
          createdAt: f.createdAt,
        })),
    };
  },
});

// =============================================================================
// HTTP actions for storage-first uploads/serving (routed in http.ts)
// =============================================================================

export const generateUploadUrl = httpAction(async (ctx) => {
  const url = await ctx.storage.generateUploadUrl();
  return Response.json({ url });
});

/**
 * Internal mutation to create file record from uploaded storage with tier validation
 */
export const createFileFromStorage = mutation({
  args: {
    walletAddress: v.string(),
    storageId: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    purpose: v.union(
      v.literal('assistants'),
      v.literal('vision'),
      v.literal('batch'),
      v.literal('fine-tune')
    ),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    size: v.number(),
    hash: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const fileId = crypto.randomUUID();

    // Get user and validate tier limits
    const user = await getCurrentUser(ctx);
    if (!user || user.walletAddress !== args.walletAddress) {
      throw new ConvexError('Unauthorized');
    }

    const userTier = user.subscription?.tier || 'free';

    // Check upload limits based on subscription tier
    const uploadCheck = await checkUploadLimits(
      ctx,
      args.walletAddress,
      userTier as keyof typeof TIER_FILE_LIMITS,
      args.size
    );

    if (!uploadCheck.canUpload) {
      throw new ConvexError(uploadCheck.error || 'Upload not allowed');
    }

    const fileDocId = await ctx.db.insert('files', {
      walletAddress: args.walletAddress,
      fileId,
      fileName: args.fileName,
      mimeType: args.mimeType,
      size: args.size,
      hash: args.hash,
      storageId: args.storageId,
      url: args.url,
      purpose: args.purpose,
      description: args.description,
      tags: args.tags ?? [],
      status: 'processed',
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(fileDocId);
  },
});

// Serve a storage file by storageId with content-type passthrough
export const serveStorage = httpAction(async (ctx, request) => {
  const { searchParams } = new URL(request.url);
  const storageId = searchParams.get('id');
  if (!storageId) {
    return new Response('Missing id', { status: 400 });
  }
  const blob = await ctx.storage.get(storageId as Id<'_storage'>);
  if (!blob) {
    return new Response('Not found', { status: 404 });
  }
  // Best-effort: let browser sniff if contentType unknown
  return new Response(blob);
});

// Register an uploaded storage object as a file row with metadata and URL
export const registerUpload = httpAction(async (ctx, request) => {
  try {
    const body = (await request.json()) as {
      walletAddress: string;
      storageId: string;
      fileName: string;
      mimeType: string;
      purpose: 'assistants' | 'vision' | 'batch' | 'fine-tune';
      description?: string;
      tags?: string[];
    };

    const meta = await ctx.storage.getMetadata(
      body.storageId as Id<'_storage'>
    );
    if (!meta) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid storageId',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check file size against tier limits before creating file record
    if (meta.size > 5 * 1024 * 1024) {
      // 5MB system hard limit
      return new Response(
        JSON.stringify({
          success: false,
          error: `File size ${Math.round(meta.size / (1024 * 1024))}MB exceeds system limit of 5MB`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const url = await ctx.storage.getUrl(body.storageId as Id<'_storage'>);

    // Use the mutation to create the file record (it will check tier limits)
    const file = await ctx.runMutation(api.files.createFileFromStorage, {
      walletAddress: body.walletAddress,
      storageId: body.storageId,
      fileName: body.fileName,
      mimeType: body.mimeType,
      purpose: body.purpose,
      description: body.description,
      tags: body.tags,
      size: meta.size,
      hash: meta.sha256,
      url: url ?? undefined,
    });

    return Response.json({
      success: true,
      file: {
        fileId: file?.fileId,
        url: file?.url,
        mimeType: file?.mimeType,
        size: file?.size,
        storageId: file?.storageId,
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// convex/googleDrive.ts --------------------------------------------------------
import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Search cached Google Drive files
export const searchGoogleDrive = query({
  args: {
    query: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    owners: v.optional(v.array(v.string())),
    shared: v.optional(v.boolean()),
    starred: v.optional(v.boolean()),
    trashed: v.optional(v.boolean()),
    pageSize: v.optional(v.number()),
    pageToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }

    // First check cached results
    let q = ctx.db
      .query("googleDriveFiles")
      .withIndex("by_user", (q: any) => q.eq("userId", identity.subject as any));

    if (args.trashed !== undefined) {
      // Filter by trashed status
      q = q.filter((q) => q.eq(q.field("trashed"), args.trashed));
    }

    if (args.starred !== undefined) {
      q = q.filter((q) => q.eq(q.field("starred"), args.starred));
    }

    if (args.shared !== undefined) {
      q = q.filter((q) => q.eq(q.field("shared"), args.shared));
    }

    if (args.mimeType) {
      q = q.filter((q) => q.eq(q.field("mimeType"), args.mimeType));
    }

    const files = await q.take(args.pageSize || 20);

    return {
      files,
      nextPageToken: null, // Cached results don't have pagination
    };
  },
});

// Cache file data from Google Drive API
export const cacheFile = mutation({
  args: {
    userId: v.id("users"),
    fileId: v.string(),
    file: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("googleDriveFiles")
      .withIndex("by_user_fileId", (q) =>
        q.eq("userId", args.userId).eq("fileId", args.fileId),
      )
      .first();

    const fileData = {
      userId: args.userId,
      fileId: args.file.id,
      name: args.file.name,
      mimeType: args.file.mimeType,
      size: args.file.size,
      createdTime: new Date(args.file.createdTime).getTime(),
      modifiedTime: new Date(args.file.modifiedTime).getTime(),
      webViewLink: args.file.webViewLink,
      webContentLink: args.file.webContentLink,
      owners: args.file.owners?.map((owner: any) => owner.emailAddress) || [],
      shared: args.file.shared || false,
      starred: args.file.starred || false,
      trashed: args.file.trashed || false,
      parents: args.file.parents || [],
      permissions: args.file.permissions,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, fileData);
    } else {
      await ctx.db.insert("googleDriveFiles", {
        ...fileData,
        createdAt: Date.now(),
        contentExtracted: false,
        accessCount: 0,
      });
    }
  },
});

export const updateFileContent = mutation({
  args: {
    userId: v.id("users"),
    fileId: v.string(),
    contentSummary: v.string(),
    contentExtracted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("googleDriveFiles")
      .withIndex("by_user_fileId", (q) =>
        q.eq("userId", args.userId).eq("fileId", args.fileId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        contentSummary: args.contentSummary,
        contentExtracted: args.contentExtracted,
        extractedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

export const saveSearchHistory = mutation({
  args: {
    userId: v.id("users"),
    query: v.string(),
    filters: v.optional(v.any()),
    resultCount: v.number(),
    searchTimeMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("googleDriveSearchHistory", {
      userId: args.userId,
      query: args.query,
      filters: args.filters,
      resultCount: args.resultCount,
      searchTimeMs: args.searchTimeMs,
      createdAt: Date.now(),
    });
  },
});

// Get search history
export const getSearchHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }

    return await ctx.db
      .query("googleDriveSearchHistory")
      .withIndex("by_user_created", (q: any) => q.eq("userId", identity.subject as any))
      .order("desc")
      .take(args.limit || 10);
  },
});

// Get file by ID
export const getFile = query({
  args: {
    fileId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }

    const file = await ctx.db
      .query("googleDriveFiles")
      .withIndex("by_user_fileId", (q: any) =>
        q.eq("userId", identity.subject as any).eq("fileId", args.fileId),
      )
      .first();

    return file;
  },
});

// Get recently accessed files
export const getRecentFiles = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }

    return await ctx.db
      .query("googleDriveFiles")
      .withIndex("by_user", (q: any) => q.eq("userId", identity.subject as any))
      .filter((q) => q.eq(q.field("trashed"), false))
      .order("desc")
      .take(args.limit || 10);
  },
});

// Get starred files
export const getStarredFiles = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }

    return await ctx.db
      .query("googleDriveFiles")
      .withIndex("by_user_starred", (q: any) =>
        q.eq("userId", identity.subject as any).eq("starred", true),
      )
      .filter((q: any) => q.eq(q.field("trashed"), false))
      .take(args.limit || 20);
  },
});

// Get shared files
export const getSharedFiles = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }

    return await ctx.db
      .query("googleDriveFiles")
      .withIndex("by_user_shared", (q: any) =>
        q.eq("userId", identity.subject as any).eq("shared", true),
      )
      .filter((q: any) => q.eq(q.field("trashed"), false))
      .take(args.limit || 20);
  },
});

// Live search Google Drive API via Pica (action for real-time search)
export const liveSearchGoogleDrive = action({
  args: {
    query: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    owners: v.optional(v.array(v.string())),
    shared: v.optional(v.boolean()),
    starred: v.optional(v.boolean()),
    trashed: v.optional(v.boolean()),
    pageSize: v.optional(v.number()),
    pageToken: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ files: any[]; nextPageToken: string | null }> => {
    const picaSecret = process.env.PICA_SECRET_KEY;
    const connectionKey = process.env.GOOGLE_DRIVE_CONNECTION_KEY;

    if (!picaSecret || !connectionKey) {
      console.warn('Missing Pica configuration, falling back to cached results');
      const cached = await ctx.runQuery(api.googleDrive.searchGoogleDrive, args);
      return { ...cached, nextPageToken: null };
    }

    try {
      // Build Google Drive API query string
      const queryParts: string[] = [];

      if (args.query) queryParts.push(`name contains '${args.query}'`);
      if (args.mimeType) queryParts.push(`mimeType='${args.mimeType}'`);
      if (args.starred !== undefined) queryParts.push(`starred=${args.starred}`);
      if (args.trashed !== undefined) queryParts.push(`trashed=${args.trashed}`);
      if (args.shared !== undefined) queryParts.push(`sharedWithMe=${args.shared}`);

      if (args.dateFrom) {
        const dateStr = new Date(args.dateFrom).toISOString();
        queryParts.push(`modifiedTime >= '${dateStr}'`);
      }

      if (args.dateTo) {
        const dateStr = new Date(args.dateTo).toISOString();
        queryParts.push(`modifiedTime <= '${dateStr}'`);
      }

      const q = queryParts.join(' and ');

      // Build query parameters
      const queryParams = new URLSearchParams({
        ...(q && { q }),
        pageSize: String(args.pageSize || 20),
        orderBy: 'modifiedTime desc',
        ...(args.pageToken && { pageToken: args.pageToken }),
      });

      const url = `https://api.picaos.com/v1/passthrough/files?${queryParams}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-pica-secret': picaSecret,
          'x-pica-connection-key': connectionKey,
          'x-pica-action-id': 'conn_mod_def::F_JAdK0r65A::IwQnCSpVSSCFUR8QsdeIjQ',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Pica API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      return {
        files: result.files || [],
        nextPageToken: result.nextPageToken || null,
      };
    } catch (error) {
      console.error('Error searching Google Drive via Pica:', error);
      // Fall back to cached results on error
      const cached = await ctx.runQuery(api.googleDrive.searchGoogleDrive, args);
      return { ...cached, nextPageToken: null };
    }
  },
});

// Get file content from Google Drive via Pica (action for fetching actual file data)
export const getFileContent = action({
  args: {
    fileId: v.string(),
    mimeType: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    const picaSecret = process.env.PICA_SECRET_KEY;
    const connectionKey = process.env.GOOGLE_DRIVE_CONNECTION_KEY;

    if (!picaSecret || !connectionKey) {
      throw new Error('Missing Pica configuration. Set PICA_SECRET_KEY and GOOGLE_DRIVE_CONNECTION_KEY environment variables.');
    }

    try {
      // First get file metadata to determine type
      const metadataUrl = `https://api.picaos.com/v1/passthrough/files/${args.fileId}`;

      const metadataResponse = await fetch(metadataUrl, {
        method: 'GET',
        headers: {
          'x-pica-secret': picaSecret,
          'x-pica-connection-key': connectionKey,
          'x-pica-action-id': 'conn_mod_def::F_JAdgP1L4A::lx0-BYgoTJufY_mNtemdeg',
          'Content-Type': 'application/json',
        },
      });

      if (!metadataResponse.ok) {
        throw new Error(`Failed to get file metadata: ${metadataResponse.status}`);
      }

      const metadata = await metadataResponse.json();

      // Check if it's a Google Workspace file that needs export
      const googleWorkspaceTypes = [
        'application/vnd.google-apps.document',
        'application/vnd.google-apps.spreadsheet',
        'application/vnd.google-apps.presentation',
      ];

      if (googleWorkspaceTypes.includes(metadata.mimeType)) {
        // Export Google Workspace file to requested format
        const exportUrl = `https://api.picaos.com/v1/passthrough/files/${args.fileId}/export?mimeType=${encodeURIComponent(args.mimeType)}`;

        const exportResponse = await fetch(exportUrl, {
          method: 'GET',
          headers: {
            'x-pica-secret': picaSecret,
            'x-pica-connection-key': connectionKey,
            'x-pica-action-id': 'conn_mod_def::F_JAdgR6yqA::VyoMxmWnQUyRv9YWl_7GUQ',
          },
        });

        if (!exportResponse.ok) {
          throw new Error(`Failed to export file: ${exportResponse.status}`);
        }

        return await exportResponse.text();
      } else {
        // Regular file - return download link
        return metadata.webContentLink || metadata.webViewLink || 'Content not directly accessible';
      }
    } catch (error) {
      console.error('Error getting file content from Google Drive:', error);
      throw new Error(`File content retrieval failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Get folder contents from Google Drive via Pica (action for listing folder items)
export const getFolderContents = action({
  args: {
    folderId: v.string(),
    pageSize: v.optional(v.number()),
    pageToken: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ files: any[]; nextPageToken: string | null }> => {
    const picaSecret = process.env.PICA_SECRET_KEY;
    const connectionKey = process.env.GOOGLE_DRIVE_CONNECTION_KEY;

    if (!picaSecret || !connectionKey) {
      throw new Error('Missing Pica configuration. Set PICA_SECRET_KEY and GOOGLE_DRIVE_CONNECTION_KEY environment variables.');
    }

    try {
      // Build query for files in this folder
      const queryParams = new URLSearchParams({
        q: `'${args.folderId}' in parents and trashed=false`,
        pageSize: String(args.pageSize || 50),
        orderBy: 'folder,name',
        ...(args.pageToken && { pageToken: args.pageToken }),
      });

      const url = `https://api.picaos.com/v1/passthrough/files?${queryParams}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-pica-secret': picaSecret,
          'x-pica-connection-key': connectionKey,
          'x-pica-action-id': 'conn_mod_def::F_JAdK0r65A::IwQnCSpVSSCFUR8QsdeIjQ',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Pica API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      return {
        files: result.files || [],
        nextPageToken: result.nextPageToken || null,
      };
    } catch (error) {
      console.error('Error getting folder contents from Google Drive:', error);
      throw new Error(`Folder contents retrieval failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});
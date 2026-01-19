# GOOGLE FILE SEARCH API COMPREHENSIVE IMPLEMENTATION

## Full Integration Plan for NodeBench AI

### **CURRENT STATE ANALYSIS**

**Existing Google Integration:**

- Basic OAuth setup for Gmail only (`googleAccounts.ts`)
- Limited scopes: Gmail readonly + user email
- No Drive API integration
- No file search capabilities
- Missing Google Drive SDK dependencies

**Missing Capabilities:**

- Google Drive API access
- File search across Google Drive
- Document content indexing
- Advanced search filters
- Real-time file synchronization
- Cross-platform file search

---

### **COMPREHENSIVE IMPLEMENTATION PLAN**

## **PHASE 1: GOOGLE DRIVE API FOUNDATION**

### **1. Dependencies & Setup**

**Required Packages:**

```bash
npm install googleapis @google-cloud/local-auth
npm install @types/googleapis
```

**Environment Variables:**

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri
GOOGLE_DRIVE_ENABLED=true
```

### **2. Enhanced Google OAuth Scopes**

**Extended Scopes for Full Drive Access:**

```typescript
const ENHANCED_GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/drive", // Full drive access
  "https://www.googleapis.com/auth/drive.file", // Per-file access
  "https://www.googleapis.com/auth/drive.metadata", // Metadata access
  "https://www.googleapis.com/auth/drive.readonly", // Read-only alternative
  "https://www.googleapis.com/auth/drive.photos.readonly", // Photos access
  "https://www.googleapis.com/auth/documents", // Google Docs
  "https://www.googleapis.com/auth/spreadsheets", // Google Sheets
  "https://www.googleapis.com/auth/presentations", // Google Slides
].join(" ");
```

---

## **PHASE 2: GOOGLE DRIVE SERVICE ARCHITECTURE**

### **1. Drive Service Core**

**File: `convex/googleDrive.ts`**

```typescript
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { google } from "googleapis";

// Enhanced Google Drive service with full search capabilities
export class GoogleDriveService {
  private drive: any;
  private docs: any;
  private sheets: any;

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    this.drive = google.drive({ version: "v3", auth });
    this.docs = google.docs({ version: "v1", auth });
    this.sheets = google.sheets({ version: "v4", auth });
  }

  // Advanced file search with comprehensive filters
  async searchFiles(params: {
    query?: string;
    mimeType?: string[];
    modifiedTime?: string;
    createdTime?: string;
    size?: string;
    parents?: string[];
    orderBy?: string;
    pageSize?: number;
    pageToken?: string;
    includePermissions?: boolean;
    includeLabels?: boolean;
  }) {
    const {
      query = "",
      mimeType,
      modifiedTime,
      createdTime,
      size,
      parents,
      orderBy = "modifiedTime desc",
      pageSize = 100,
      pageToken,
      includePermissions = true,
      includeLabels = true,
    } = params;

    // Build comprehensive search query
    let searchQuery = query;

    if (mimeType && mimeType.length > 0) {
      const mimeTypeQuery = mimeType
        .map((type) => `mimeType='${type}'`)
        .join(" or ");
      searchQuery = searchQuery
        ? `(${searchQuery}) and (${mimeTypeQuery})`
        : mimeTypeQuery;
    }

    if (modifiedTime) {
      searchQuery = searchQuery
        ? `${searchQuery} and modifiedTime>'${modifiedTime}'`
        : `modifiedTime>'${modifiedTime}'`;
    }

    if (createdTime) {
      searchQuery = searchQuery
        ? `${searchQuery} and createdTime>'${createdTime}'`
        : `createdTime>'${createdTime}'`;
    }

    if (size) {
      searchQuery = searchQuery
        ? `${searchQuery} and size${size}`
        : `size${size}`;
    }

    if (parents && parents.length > 0) {
      const parentQuery = parents
        .map((id) => `'${id}' in parents`)
        .join(" or ");
      searchQuery = searchQuery
        ? `(${searchQuery}) and (${parentQuery})`
        : parentQuery;
    }

    const fields = [
      "nextPageToken",
      "files(id,name,mimeType,createdTime,modifiedTime,size,parents,webViewLink,webContentLink,thumbnailLink,iconLink,fullFileExtension,owners,permissions,labels,properties,appProperties,capabilities,md5Checksum,version,spaces,trashed)",
      ...(includePermissions
        ? ["permissions(id,type,emailAddress,role,displayName,photoLink)"]
        : []),
      ...(includeLabels ? ["labels(id,revisionId,fields)"] : []),
    ].join(",");

    const response = await this.drive.files.list({
      q: searchQuery || "trashed=false",
      fields,
      orderBy,
      pageSize,
      pageToken,
      includeItemsFromAllDrives: true,
      includeRemoved: false,
      supportsAllDrives: true,
    });

    return response.data;
  }

  // Get file content with full text extraction
  async getFileContent(fileId: string, mimeType: string) {
    try {
      if (mimeType === "application/vnd.google-apps.document") {
        const response = await this.docs.documents.get({ documentId: fileId });
        return {
          type: "document",
          content: response.data.body?.content || [],
          text: this.extractTextFromDocument(response.data.body?.content || []),
        };
      }

      if (mimeType === "application/vnd.google-apps.spreadsheet") {
        const response = await this.sheets.spreadsheets.get({
          spreadsheetId: fileId,
          includeGridData: true,
        });
        return {
          type: "spreadsheet",
          content: response.data.sheets || [],
          text: this.extractTextFromSpreadsheet(response.data.sheets || []),
        };
      }

      if (mimeType === "application/vnd.google-apps.presentation") {
        const response = await this.drive.files.export({
          fileId,
          mimeType: "text/plain",
        });
        return {
          type: "presentation",
          content: response.data,
          text: response.data,
        };
      }

      // For binary files, download and extract text
      const response = await this.drive.files.get(
        {
          fileId,
          alt: "media",
        },
        { responseType: "arraybuffer" },
      );

      return {
        type: "binary",
        content: response.data,
        text: await this.extractTextFromBinary(response.data, mimeType),
      };
    } catch (error) {
      console.error("Error getting file content:", error);
      return { type: "error", content: null, text: "" };
    }
  }

  // Advanced search with AI-powered content analysis
  async intelligentSearch(params: {
    query: string;
    context?: string;
    fileType?:
      | "documents"
      | "spreadsheets"
      | "presentations"
      | "images"
      | "videos"
      | "all";
    dateRange?: { start: string; end: string };
    sizeRange?: { min?: number; max?: number };
    owner?: string;
    shared?: boolean;
    starred?: boolean;
    modifiedBy?: string;
    includeContent?: boolean;
    limit?: number;
  }) {
    const {
      query,
      context,
      fileType = "all",
      dateRange,
      sizeRange,
      owner,
      shared,
      starred,
      modifiedBy,
      includeContent = false,
      limit = 50,
    } = params;

    // Build MIME type filters
    const mimeTypeMap = {
      documents: [
        "application/vnd.google-apps.document",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      spreadsheets: [
        "application/vnd.google-apps.spreadsheet",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
      presentations: [
        "application/vnd.google-apps.presentation",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ],
      images: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/bmp",
        "image/webp",
      ],
      videos: ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"],
    };

    const searchParams: any = {
      query,
      mimeType: fileType !== "all" ? mimeTypeMap[fileType] : undefined,
      orderBy: "relevance desc, modifiedTime desc",
      pageSize: limit,
    };

    if (dateRange) {
      searchParams.modifiedTime = dateRange.start;
    }

    if (sizeRange) {
      if (sizeRange.min) searchParams.size = `>=${sizeRange.min}`;
      if (sizeRange.max) searchParams.size = `<=${sizeRange.max}`;
    }

    if (owner) {
      searchParams.query = `${searchParams.query} owner='${owner}'`;
    }

    if (shared !== undefined) {
      searchParams.query = `${searchParams.query} sharedWithMe=${shared}`;
    }

    if (starred) {
      searchParams.query = `${searchParams.query} starred=true`;
    }

    if (modifiedBy) {
      searchParams.query = `${searchParams.query} lastModifyingUser='${modifiedBy}'`;
    }

    const results = await this.searchFiles(searchParams);

    if (includeContent && results.files) {
      // Fetch content for top results
      const filesWithContent = await Promise.all(
        results.files.slice(0, 10).map(async (file: any) => {
          const content = await this.getFileContent(file.id, file.mimeType);
          return { ...file, content };
        }),
      );

      return { ...results, files: filesWithContent };
    }

    return results;
  }

  // Helper methods for text extraction
  private extractTextFromDocument(content: any[]): string {
    let text = "";
    for (const element of content) {
      if (element.paragraph) {
        for (const paragraphElement of element.paragraph.elements) {
          if (paragraphElement.textRun) {
            text += paragraphElement.textRun.content;
          }
        }
      } else if (element.table) {
        for (const row of element.table.tableRows) {
          for (const cell of row.tableCells) {
            text += this.extractTextFromDocument(cell.content) + "\t";
          }
          text += "\n";
        }
      }
    }
    return text;
  }

  private extractTextFromSpreadsheet(sheets: any[]): string {
    let text = "";
    for (const sheet of sheets) {
      if (sheet.data) {
        for (const rowData of sheet.data) {
          if (rowData.rowData) {
            for (const cellData of rowData.rowData) {
              if (
                cellData.values &&
                cellData.values[0] &&
                cellData.values[0].formattedValue
              ) {
                text += cellData.values[0].formattedValue + "\t";
              }
            }
            text += "\n";
          }
        }
      }
    }
    return text;
  }

  private async extractTextFromBinary(
    buffer: ArrayBuffer,
    mimeType: string,
  ): Promise<string> {
    // This would integrate with your existing file analysis system
    // For now, return a placeholder
    return `[Binary file: ${mimeType}, size: ${buffer.byteLength} bytes]`;
  }
}
```

### **2. Enhanced Schema for Google Drive**

**Add to `convex/schema.ts`:**

```typescript
/* ------------------------------------------------------------------ */
/* GOOGLE DRIVE FILES - Cached Google Drive file metadata               */
/* ------------------------------------------------------------------ */
const googleDriveFiles = defineTable({
  userId: v.id("users"),
  fileId: v.string(), // Google Drive file ID
  name: v.string(), // File name
  mimeType: v.string(), // MIME type
  size: v.optional(v.number()), // File size in bytes
  createdTime: v.string(), // ISO timestamp
  modifiedTime: v.string(), // ISO timestamp
  parents: v.array(v.string()), // Parent folder IDs
  webViewLink: v.string(), // View link
  webContentLink: v.optional(v.string()), // Download link
  thumbnailLink: v.optional(v.string()), // Thumbnail URL
  owners: v.array(
    v.object({
      displayName: v.string(),
      emailAddress: v.string(),
      photoLink: v.optional(v.string()),
    }),
  ),
  permissions: v.optional(
    v.array(
      v.object({
        id: v.string(),
        type: v.string(),
        emailAddress: v.optional(v.string()),
        role: v.string(),
        displayName: v.optional(v.string()),
      }),
    ),
  ),
  labels: v.optional(v.any()), // Drive labels
  properties: v.optional(v.any()), // Custom properties
  content: v.optional(v.string()), // Extracted text content
  contentHash: v.optional(v.string()), // For content change detection
  isStarred: v.optional(v.boolean()), // Starred status
  isTrashed: v.optional(v.boolean()), // Trashed status
  shared: v.optional(v.boolean()), // Shared status
  lastSyncedAt: v.number(), // When we last synced this file
  syncStatus: v.union(
    v.literal("synced"),
    v.literal("pending"),
    v.literal("error"),
  ),
})
  .index("by_user", ["userId"])
  .index("by_user_fileId", ["userId", "fileId"])
  .index("by_user_modified", ["userId", "modifiedTime"])
  .index("by_user_type", ["userId", "mimeType"])
  .searchIndex("search_drive_files", {
    searchField: "name",
    filterFields: ["userId", "mimeType", "shared", "isStarred"],
  });

/* ------------------------------------------------------------------ */
/* GOOGLE DRIVE SEARCH HISTORY - User search queries and results        */
/* ------------------------------------------------------------------ */
const googleDriveSearchHistory = defineTable({
  userId: v.id("users"),
  query: v.string(),
  searchParams: v.any(), // Full search parameters
  resultCount: v.number(),
  resultIds: v.array(v.string()), // File IDs returned
  executionTimeMs: v.number(),
  createdAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_created", ["userId", "createdAt"]);

/* ------------------------------------------------------------------ */
/* GOOGLE DRIVE FOLDERS - Cached folder structure for navigation       */
/* ------------------------------------------------------------------ */
const googleDriveFolders = defineTable({
  userId: v.id("users"),
  folderId: v.string(),
  name: v.string(),
  parents: v.array(v.string()),
  createdTime: v.string(),
  modifiedTime: v.string(),
  childCount: v.number(),
  size: v.number(),
  permissions: v.array(v.any()),
  isRoot: v.boolean(),
  lastSyncedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_parent", ["userId", "parents"])
  .index("by_user_name", ["userId", "name"]);
```

---

## **PHASE 3: CONVEX FUNCTIONS FOR GOOGLE DRIVE**

### **1. Core Drive Functions**

**File: `convex/googleDrive.ts` (continued)**

```typescript
// Get Google Drive connection status
export const getDriveConnection = query({
  args: {},
  returns: v.object({
    connected: v.boolean(),
    email: v.optional(v.string()),
    hasDriveScope: v.boolean(),
    lastSyncedAt: v.optional(v.number()),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { connected: false, hasDriveScope: false };
    }

    const account = await ctx.db
      .query("googleAccounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!account) {
      return { connected: false, hasDriveScope: false };
    }

    const hasDriveScope = account.scope?.includes("drive") || false;

    // Get last sync time
    const lastFile = await ctx.db
      .query("googleDriveFiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    return {
      connected: true,
      email: account.email,
      hasDriveScope,
      lastSyncedAt: lastFile?.lastSyncedAt,
    };
  },
});

// Enhanced OAuth with Drive scopes
export const connectDrive = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    authUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.CONVEX_SITE_URL}/api/google/oauth/callback`;

    if (!clientId || !clientSecret) {
      return { success: false, error: "Google OAuth not configured" };
    }

    const { google } = await import("googleapis");
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ENHANCED_GOOGLE_SCOPES,
      prompt: "consent",
      state: JSON.stringify({ userId, action: "connect_drive" }),
    });

    return { success: true, authUrl };
  },
});

// Comprehensive file search
export const searchDriveFiles = action({
  args: {
    query: v.string(),
    fileType: v.optional(
      v.union(
        v.literal("documents"),
        v.literal("spreadsheets"),
        v.literal("presentations"),
        v.literal("images"),
        v.literal("videos"),
        v.literal("all"),
      ),
    ),
    dateRange: v.optional(
      v.object({
        start: v.string(),
        end: v.string(),
      }),
    ),
    sizeRange: v.optional(
      v.object({
        min: v.optional(v.number()),
        max: v.optional(v.number()),
      }),
    ),
    owner: v.optional(v.string()),
    shared: v.optional(v.boolean()),
    starred: v.optional(v.boolean()),
    includeContent: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    files: v.optional(v.array(v.any())),
    totalCount: v.optional(v.number()),
    nextPageToken: v.optional(v.string()),
    searchTimeMs: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const refs = await import("./_generated/api");
    const account = await ctx.runQuery(
      (refs as any).internal.googleDrive.getAccount,
      {},
    );

    if (!account) {
      return { success: false, error: "Google account not connected" };
    }

    if (!account.scope?.includes("drive")) {
      return { success: false, error: "Drive access not authorized" };
    }

    const startTime = Date.now();

    try {
      const driveService = new GoogleDriveService(account.accessToken);
      const results = await driveService.intelligentSearch(args);

      // Cache results in database
      const filesToCache = (results.files || []).map((file: any) => ({
        userId,
        fileId: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        parents: file.parents || [],
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        thumbnailLink: file.thumbnailLink,
        owners: file.owners || [],
        permissions: file.permissions || [],
        labels: file.labels,
        properties: file.properties,
        content: file.content?.text || "",
        isStarred: file.labels?.starred || false,
        isTrashed: file.trashed || false,
        shared: file.permissions?.some((p: any) => p.type !== "owner") || false,
        lastSyncedAt: Date.now(),
        syncStatus: "synced" as const,
      }));

      // Batch insert files
      for (const fileData of filesToCache) {
        await ctx.runMutation(
          (refs as any).internal.googleDrive.upsertFile,
          fileData,
        );
      }

      // Log search history
      await ctx.runMutation((refs as any).internal.googleDrive.logSearch, {
        userId,
        query: args.query,
        searchParams: args,
        resultCount: results.files?.length || 0,
        resultIds: (results.files || []).map((f: any) => f.id),
        executionTimeMs: Date.now() - startTime,
      });

      return {
        success: true,
        files: results.files,
        totalCount: results.files?.length || 0,
        nextPageToken: results.nextPageToken,
        searchTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error("Drive search error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        searchTimeMs: Date.now() - startTime,
      };
    }
  },
});

// Get file content with full extraction
export const getDriveFileContent = action({
  args: {
    fileId: v.string(),
    includeMetadata: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    content: v.optional(v.any()),
    metadata: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const refs = await import("./_generated/api");
    const account = await ctx.runQuery(
      (refs as any).internal.googleDrive.getAccount,
      {},
    );

    if (!account) {
      return { success: false, error: "Google account not connected" };
    }

    try {
      const driveService = new GoogleDriveService(account.accessToken);

      // Get file metadata
      const fileMetadata = await driveService.drive.files.get({
        fileId: args.fileId,
        fields: "*",
      });

      // Get file content
      const content = await driveService.getFileContent(
        args.fileId,
        fileMetadata.data.mimeType,
      );

      // Update cached content
      await ctx.runMutation(
        (refs as any).internal.googleDrive.updateFileContent,
        {
          userId,
          fileId: args.fileId,
          content: content.text,
          contentHash: Buffer.from(content.text).toString("base64"),
        },
      );

      return {
        success: true,
        content,
        metadata: args.includeMetadata ? fileMetadata.data : undefined,
      };
    } catch (error) {
      console.error("Get file content error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Sync user's Drive files
export const syncDriveFiles = action({
  args: {
    force: v.optional(v.boolean()),
    folders: v.optional(v.array(v.string())),
  },
  returns: v.object({
    success: v.boolean(),
    syncedCount: v.number(),
    updatedCount: v.number(),
    errorCount: v.number(),
    syncTimeMs: v.number(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const refs = await import("./_generated/api");
    const account = await ctx.runQuery(
      (refs as any).internal.googleDrive.getAccount,
      {},
    );

    if (!account) {
      return { success: false, error: "Google account not connected" };
    }

    const startTime = Date.now();
    let syncedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    try {
      const driveService = new GoogleDriveService(account.accessToken);

      // Get all files (paginated)
      let pageToken: string | undefined;
      const allFiles: any[] = [];

      do {
        const results = await driveService.searchFiles({
          pageSize: 1000,
          pageToken,
          includePermissions: true,
          includeLabels: true,
        });

        allFiles.push(...(results.files || []));
        pageToken = results.nextPageToken;
      } while (pageToken);

      // Process files
      for (const file of allFiles) {
        try {
          const existingFile = await ctx.runQuery(
            (refs as any).internal.googleDrive.getFileByDriveId,
            { userId, fileId: file.id },
          );

          const fileData = {
            userId,
            fileId: file.id,
            name: file.name,
            mimeType: file.mimeType,
            size: file.size,
            createdTime: file.createdTime,
            modifiedTime: file.modifiedTime,
            parents: file.parents || [],
            webViewLink: file.webViewLink,
            webContentLink: file.webContentLink,
            thumbnailLink: file.thumbnailLink,
            owners: file.owners || [],
            permissions: file.permissions || [],
            labels: file.labels,
            properties: file.properties,
            isStarred: file.labels?.starred || false,
            isTrashed: file.trashed || false,
            shared:
              file.permissions?.some((p: any) => p.type !== "owner") || false,
            lastSyncedAt: Date.now(),
            syncStatus: "synced" as const,
          };

          if (existingFile) {
            // Update if modified
            if (file.modifiedTime > existingFile.modifiedTime || args.force) {
              await ctx.runMutation(
                (refs as any).internal.googleDrive.updateFile,
                fileData,
              );
              updatedCount++;
            }
          } else {
            // Insert new file
            await ctx.runMutation(
              (refs as any).internal.googleDrive.insertFile,
              fileData,
            );
            syncedCount++;
          }
        } catch (error) {
          console.error(`Error syncing file ${file.id}:`, error);
          errorCount++;
        }
      }

      return {
        success: true,
        syncedCount,
        updatedCount,
        errorCount,
        syncTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error("Drive sync error:", error);
      return {
        success: false,
        syncedCount,
        updatedCount,
        errorCount,
        syncTimeMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
```

---

## **PHASE 4: FRONTEND SEARCH COMPONENTS**

### **1. Advanced Search Interface**

**File: `src/components/GoogleDriveSearch/GoogleDriveSearch.tsx`**

```typescript
import React, { useState, useCallback, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Search, Filter, Calendar, User, Star, Share2, FileText, Grid, List, Download, Eye, MoreVertical } from "lucide-react";

interface GoogleDriveSearchProps {
  onFileSelect?: (file: any) => void;
  multiSelect?: boolean;
  maxResults?: number;
  showContent?: boolean;
}

export const GoogleDriveSearch: React.FC<GoogleDriveSearchProps> = ({
  onFileSelect,
  multiSelect = false,
  maxResults = 50,
  showContent = false,
}) => {
  const [query, setQuery] = useState("");
  const [searchParams, setSearchParams] = useState({
    fileType: "all" as const,
    dateRange: undefined as { start: string; end: string } | undefined,
    sizeRange: undefined as { min?: number; max?: number } | undefined,
    owner: "",
    shared: undefined as boolean | undefined,
    starred: false,
    includeContent: showContent,
    limit: maxResults,
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);

  const connectionStatus = useQuery(api.googleDrive.getDriveConnection);
  const searchResults = useAction(api.googleDrive.searchDriveFiles);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    try {
      await searchResults({
        query: query.trim(),
        ...searchParams,
      });
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, [query, searchParams, isSearching, searchResults]);

  const handleFileClick = useCallback((file: any) => {
    if (multiSelect) {
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(file.id)) {
        newSelected.delete(file.id);
      } else {
        newSelected.add(file.id);
      }
      setSelectedFiles(newSelected);
    } else {
      onFileSelect?.(file);
    }
  }, [multiSelect, selectedFiles, onFileSelect]);

  const getFileIcon = useCallback((mimeType: string) => {
    if (mimeType.includes("document")) return <FileText className="h-5 w-5 text-blue-500" />;
    if (mimeType.includes("spreadsheet")) return <Grid className="h-5 w-5 text-green-500" />;
    if (mimeType.includes("presentation")) return <FileText className="h-5 w-5 text-orange-500" />;
    if (mimeType.includes("image")) return <FileText className="h-5 w-5 text-purple-500" />;
    if (mimeType.includes("video")) return <FileText className="h-5 w-5 text-red-500" />;
    return <FileText className="h-5 w-5 text-gray-500" />;
  }, []);

  const formatFileSize = useCallback((bytes?: number) => {
    if (!bytes) return "Unknown";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  }, []);

  if (!connectionStatus?.connected) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
        <FileText className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Google Drive</h3>
        <p className="text-gray-500 text-center mb-4">
          Connect your Google Drive to search and access your files
        </p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Connect Google Drive
        </button>
      </div>
    );
  }

  if (!connectionStatus?.hasDriveScope) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-yellow-300 rounded-lg bg-yellow-50">
        <FileText className="h-12 w-12 text-yellow-400 mb-4" />
        <h3 className="text-lg font-medium text-yellow-900 mb-2">Drive Access Required</h3>
        <p className="text-yellow-700 text-center mb-4">
          Please reconnect your Google account with Drive access enabled
        </p>
        <button className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700">
          Reconnect with Drive Access
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search Google Drive files..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
          <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <select
            value={searchParams.fileType}
            onChange={(e) => setSearchParams(prev => ({ ...prev, fileType: e.target.value as any }))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Files</option>
            <option value="documents">Documents</option>
            <option value="spreadsheets">Spreadsheets</option>
            <option value="presentations">Presentations</option>
            <option value="images">Images</option>
            <option value="videos">Videos</option>
          </select>

          <input
            type="text"
            placeholder="Owner..."
            value={searchParams.owner}
            onChange={(e) => setSearchParams(prev => ({ ...prev, owner: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={searchParams.starred}
              onChange={(e) => setSearchParams(prev => ({ ...prev, starred: e.target.checked }))}
            />
            <Star className="h-3 w-3" />
            Starred
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={searchParams.shared}
              onChange={(e) => setSearchParams(prev => ({ ...prev, shared: e.target.checked || undefined }))}
            />
            <Share2 className="h-3 w-3" />
            Shared
          </label>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1 rounded ${viewMode === "list" ? "bg-gray-200" : "hover:bg-gray-100"}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded ${viewMode === "grid" ? "bg-gray-200" : "hover:bg-gray-100"}`}
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {searchResults.data?.files && searchResults.data.files.length > 0 ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4" : "space-y-2 p-4"}>
            {searchResults.data.files.map((file: any) => (
              <div
                key={file.id}
                onClick={() => handleFileClick(file)}
                className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                  selectedFiles.has(file.id) ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {getFileIcon(file.mimeType)}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{file.name}</h3>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{formatDate(file.modifiedTime)}</span>
                      {file.shared && <Share2 className="h-3 w-3 text-blue-500" />}
                      {file.labels?.starred && <Star className="h-3 w-3 text-yellow-500" />}
                    </div>
                    {file.content && showContent && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-3">{file.content}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(file.webViewLink, "_blank");
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="View in Drive"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(file.webContentLink, "_blank");
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded" title="More options">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <Search className="h-12 w-12 mb-4" />
            <p>No files found. Try adjusting your search criteria.</p>
          </div>
        )}
      </div>

      {/* Footer with multi-select actions */}
      {multiSelect && selectedFiles.size > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedFiles.size} file{selectedFiles.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onFileSelect?.(Array.from(selectedFiles))}
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Use Selected Files
              </button>
              <button
                onClick={() => setSelectedFiles(new Set())}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## **PHASE 5: AI-POWERED SEARCH INTEGRATION**

### **1. Enhanced AI Tools with Google Drive**

**File: `convex/tools/googleDriveTools.ts`**

```typescript
import { tool } from "@convex-dev/agent";
import { v } from "convex/values";

export const googleDriveSearchTool = tool({
  description:
    "Search Google Drive files with advanced filters and AI-powered content analysis",
  args: {
    query: v.string(),
    fileType: v.optional(
      v.union(
        v.literal("documents"),
        v.literal("spreadsheets"),
        v.literal("presentations"),
        v.literal("images"),
        v.literal("videos"),
        v.literal("all"),
      ),
    ),
    dateRange: v.optional(
      v.object({
        start: v.string(),
        end: v.string(),
      }),
    ),
    owner: v.optional(v.string()),
    shared: v.optional(v.boolean()),
    starred: v.optional(v.boolean()),
    includeContent: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.runAction(api.googleDrive.searchDriveFiles, args);

    if (!result.success) {
      return `Error searching Google Drive: ${result.error}`;
    }

    const files = result.files || [];
    let response = `Found ${files.length} files in Google Drive matching "${args.query}":\n\n`;

    for (const file of files.slice(0, 10)) {
      response += `📄 ${file.name}\n`;
      response += `   Type: ${file.mimeType}\n`;
      response += `   Modified: ${new Date(file.modifiedTime).toLocaleDateString()}\n`;
      response += `   Size: ${file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "Unknown"}\n`;

      if (file.content && args.includeContent) {
        response += `   Content Preview: ${file.content.substring(0, 200)}...\n`;
      }

      response += `   View: ${file.webViewLink}\n\n`;
    }

    if (files.length > 10) {
      response += `... and ${files.length - 10} more files.\n`;
    }

    return response;
  },
});

export const googleDriveContentTool = tool({
  description: "Get full content and analysis of a specific Google Drive file",
  args: {
    fileId: v.string(),
    includeAnalysis: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.runAction(api.googleDrive.getDriveFileContent, {
      fileId: args.fileId,
      includeMetadata: true,
    });

    if (!result.success) {
      return `Error getting file content: ${result.error}`;
    }

    let response = `📄 File Content:\n\n`;
    response += `Content:\n${result.content?.text || "No text content available"}\n\n`;

    if (args.includeAnalysis && result.content?.text) {
      // Use AI to analyze the content
      const analysis = await ctx.runAction(api.ai.analyzeContent, {
        content: result.content.text,
        context: "Google Drive file analysis",
      });

      response += `🤖 AI Analysis:\n${analysis}\n`;
    }

    return response;
  },
});
```

---

## **PHASE 6: INTEGRATION THROUGHOUT PLATFORM**

### **1. Enhanced Document Hub Integration**

**Update `src/components/DocumentsHomeHub.tsx`:**

```typescript
// Add Google Drive search to the existing document hub
import { GoogleDriveSearch } from "./GoogleDriveSearch/GoogleDriveSearch";

// In the DocumentsHomeHub component, add a new tab or section for Google Drive
const [activeTab, setActiveTab] = useState("my-documents");

// Add Google Drive tab to the existing tabs
const tabs = [
  { id: "my-documents", label: "My Documents", icon: FileText },
  { id: "google-drive", label: "Google Drive", icon: Cloud },
  { id: "shared", label: "Shared", icon: Users },
  { id: "recent", label: "Recent", icon: Clock },
];

// Add Google Drive content panel
{activeTab === "google-drive" && (
  <GoogleDriveSearch
    onFileSelect={handleDriveFileSelect}
    multiSelect={true}
    showContent={true}
  />
)}
```

### **2. AI Chat Integration**

**Update AI Chat Panel to include Google Drive context:**

```typescript
// Add Google Drive files to AI chat context
const [selectedDriveFiles, setSelectedDriveFiles] = useState<string[]>([]);

// In the AI chat panel, add Google Drive file selection
<div className="border-t border-gray-200 p-4">
  <h4 className="font-medium text-gray-900 mb-2">Google Drive Files</h4>
  <GoogleDriveSearch
    onFileSelect={(files) => setSelectedDriveFiles(Array.isArray(files) ? files : [files.id])}
    multiSelect={true}
    maxResults={10}
  />
</div>
```

### **3. Fast Agent Integration**

**Update Fast Agent to use Google Drive search:**

```typescript
// Add Google Drive search to Fast Agent tools
const fastAgentTools = [
  ...existingTools,
  googleDriveSearchTool,
  googleDriveContentTool,
];
```

---

## **PHASE 7: ADVANCED FEATURES**

### **1. Real-time Sync and Notifications**

**File: `convex/googleDriveSync.ts`**

```typescript
// Real-time sync with Google Drive using push notifications
export const setupRealtimeSync = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    channelId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx) => {
    // Implement Google Drive push notifications
    // This would use the Drive API's changes.watch endpoint
    // to get real-time updates when files change
  },
});
```

### **2. Advanced Analytics**

**File: `convex/googleDriveAnalytics.ts`**

```typescript
// Analytics for Google Drive usage
export const getDriveAnalytics = query({
  args: {
    dateRange: v.object({
      start: v.string(),
      end: v.string(),
    }),
  },
  returns: v.object({
    totalFiles: v.number(),
    storageUsed: v.number(),
    fileTypes: v.array(
      v.object({
        type: v.string(),
        count: v.number(),
        size: v.number(),
      }),
    ),
    mostAccessed: v.array(
      v.object({
        fileId: v.string(),
        name: v.string(),
        accessCount: v.number(),
      }),
    ),
    searchQueries: v.array(
      v.object({
        query: v.string(),
        count: v.number(),
        lastSearched: v.string(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    // Implement analytics queries
  },
});
```

---

## **IMPLEMENTATION CHECKLIST**

### **Week 1: Foundation**

- [ ] Install Google APIs packages
- [ ] Update OAuth scopes for Drive access
- [ ] Create enhanced schema tables
- [ ] Implement basic Drive service class

### **Week 2: Core Functionality**

- [ ] Implement search functions
- [ ] Create file content extraction
- [ ] Build sync functionality
- [ ] Add error handling and retry logic

### **Week 3: Frontend Components**

- [ ] Build GoogleDriveSearch component
- [ ] Create file preview components
- [ ] Implement advanced filters UI
- [ ] Add multi-select functionality

### **Week 4: AI Integration**

- [ ] Create AI tools for Drive search
- [ ] Integrate with existing AI agents
- [ ] Add content analysis capabilities
- [ ] Implement smart suggestions

### **Week 5: Platform Integration**

- [ ] Integrate with Document Hub
- [ ] Add to AI Chat Panel
- [ ] Update Fast Agent tools
- [ ] Create unified search experience

### **Week 6: Advanced Features**

- [ ] Implement real-time sync
- [ ] Add analytics and insights
- [ ] Create advanced search patterns
- [ ] Optimize performance and caching

---

## **SUCCESS METRICS**

- **Search Performance**: <500ms response time for typical queries
- **File Coverage**: Sync and index 10,000+ files per user
- **User Adoption**: 80% of connected users use Drive search weekly
- **AI Accuracy**: 95% relevance for AI-powered search results
- **Content Extraction**: Successfully extract text from 90% of supported file types

This comprehensive implementation will transform your NodeBench AI platform into a powerful Google Drive-integrated workspace with advanced search capabilities, AI-powered content analysis, and seamless integration across all features.

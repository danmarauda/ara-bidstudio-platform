/**
 * File Document mutations
 * Separate from fileProcessing.ts to avoid Node.js action conflicts
 */

import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { createModuleLogger } from './utils/logger';

const logger = createModuleLogger('file-documents');

/**
 * Get file type category from MIME type
 */
function getFileTypeCategory(mimeType: string): string {
  if (mimeType.startsWith('text/')) {
    return 'text';
  }
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }
  if (mimeType === 'application/pdf') {
    return 'pdf';
  }
  if (mimeType === 'application/json' || mimeType === 'application/ld+json') {
    return 'json';
  }
  if (mimeType === 'text/csv' || mimeType === 'application/csv') {
    return 'csv';
  }
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return 'document';
  }
  if (mimeType.includes('sheet') || mimeType.includes('excel')) {
    return 'spreadsheet';
  }
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
    return 'presentation';
  }
  return 'other';
}

/**
 * Create document record for the uploaded file
 */
export const createFileDocument = mutation({
  args: {
    messageId: v.id('messages'),
    fileId: v.string(),
    walletAddress: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    extractedText: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    // Determine document type based on MIME type
    const fileCategory = getFileTypeCategory(args.mimeType);
    const docType =
      fileCategory === 'text'
        ? 'text'
        : fileCategory === 'pdf'
          ? 'pdf'
          : 'text'; // fallback to text

    // Create the document
    const documentId = await ctx.db.insert('documents', {
      ownerId: args.walletAddress,
      title: args.fileName,
      content: args.extractedText,
      type: docType,
      isPublic: false,
      metadata: {
        source: 'file_upload',
        mimeType: args.mimeType,
        category: fileCategory,
        wordCount: args.extractedText
          .split(/\s+/)
          .filter((word) => word.length > 0).length,
        characterCount: args.extractedText.length,
      },
      createdAt: now,
      updatedAt: now,
    });

    logger.info(`Created document ${documentId} for file ${args.fileId}`);
    return documentId;
  },
});

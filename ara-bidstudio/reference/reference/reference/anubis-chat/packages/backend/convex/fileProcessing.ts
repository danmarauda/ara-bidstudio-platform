'use node';

/**
 * File Processing for RAG Integration
 * Extracts text content from uploaded files and creates searchable document chunks
 */

import { v } from 'convex/values';
import { api } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { action } from './_generated/server';
import { createModuleLogger } from './utils/logger';

const logger = createModuleLogger('file-processing');

// Supported file types for content extraction
const SUPPORTED_MIME_TYPES = {
  text: ['text/plain', 'text/markdown', 'text/csv', 'text/xml', 'text/html'],
  pdf: ['application/pdf'],
  image: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
  ],
  code: ['application/json', 'text/javascript', 'application/javascript'],
};

// File size limits by type (in bytes)
const _FILE_SIZE_LIMITS = {
  text: 10 * 1024 * 1024, // 10MB
  pdf: 50 * 1024 * 1024, // 50MB
  image: 20 * 1024 * 1024, // 20MB
  default: 25 * 1024 * 1024, // 25MB
};

// Processing timeouts by file type (in milliseconds)
const PROCESSING_TIMEOUTS = {
  text: 10_000, // 10 seconds
  pdf: 60_000, // 60 seconds
  image: 120_000, // 120 seconds (OCR can be slow)
  default: 30_000, // 30 seconds
};

/**
 * Process uploaded file for RAG integration
 * Extracts text content and creates searchable document chunks
 */
export const processFileForRAG = action({
  args: {
    messageId: v.id('messages'),
    fileId: v.string(),
    walletAddress: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    documentId?: string;
    chunks?: number;
    error?: string;
    textExtracted?: boolean;
    textLength?: number;
    processingTime?: number;
    warning?: string;
  }> => {
    const startTime = Date.now();

    try {
      // Validate file parameters
      const validationResult = validateFileForProcessing(args);
      if (!validationResult.isValid) {
        logger.warn('File validation failed', {
          fileId: args.fileId,
          error: validationResult.error,
        });
        return { success: false, error: validationResult.error };
      }

      // Get the file data from storage with timeout
      const file = (await Promise.race([
        ctx.runQuery(api.files.get, {
          fileId: args.fileId,
          walletAddress: args.walletAddress,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('File retrieval timeout')), 30_000)
        ),
      ])) as any; // Type assertion needed due to Promise.race

      if (!file) {
        logger.warn('File not found for RAG processing', {
          fileId: args.fileId,
        });
        return { success: false, error: 'File not found' };
      }

      // Validate file size (if available)
      if (
        'size' in file &&
        typeof file.size === 'number' &&
        file.size > 50 * 1024 * 1024
      ) {
        // 50MB limit
        logger.warn('File too large for processing', {
          fileId: args.fileId,
          size: file.size,
        });
        return { success: false, error: 'File size exceeds 50MB limit' };
      }

      // Extract text content based on file type with timeout
      let extractedText = '';
      const extractionTimeout = getExtractionTimeout(args.mimeType);

      try {
        extractedText = await Promise.race([
          extractContentByType(ctx, file, args),
          new Promise<string>((_, reject) =>
            setTimeout(
              () => reject(new Error('Content extraction timeout')),
              extractionTimeout
            )
          ),
        ]);
      } catch (extractionError) {
        // Log the error but continue with metadata-only processing
        logger.error(
          'Content extraction failed, using metadata only',
          extractionError,
          {
            fileId: args.fileId,
            mimeType: args.mimeType,
          }
        );

        extractedText = `File: ${args.fileName} (${args.mimeType})\nContent extraction failed: ${extractionError instanceof Error ? extractionError.message : 'Unknown error'}`;
      }

      // For images, we expect empty text since they're handled visually
      const isImage = args.mimeType.startsWith('image/');
      if (!extractedText.trim()) {
        logger.info(
          isImage
            ? 'Image will be handled visually by multi-modal models'
            : 'No extractable text content from file',
          {
            fileId: args.fileId,
            mimeType: args.mimeType,
            isImage,
          }
        );
        return { success: true, textExtracted: false };
      }

      // Validate extracted text length
      if (extractedText.length > 1_000_000) {
        // 1MB text limit
        logger.warn('Extracted text too long, truncating', {
          fileId: args.fileId,
          originalLength: extractedText.length,
        });
        extractedText =
          extractedText.substring(0, 1_000_000) +
          '\n\n[Text truncated due to size limit]';
      }

      // Create document record for the file
      const documentId = await ctx.runMutation(
        api.fileDocuments.createFileDocument,
        {
          messageId: args.messageId,
          fileId: args.fileId,
          walletAddress: args.walletAddress,
          fileName: args.fileName,
          mimeType: args.mimeType,
          extractedText,
        }
      );

      // Process text into searchable chunks with error handling
      try {
        await ctx.runAction(api.documentProcessing.processDocument, {
          documentId,
          content: extractedText,
        });
      } catch (chunkingError) {
        logger.error('Document chunking failed', chunkingError, {
          documentId,
          fileId: args.fileId,
        });

        // Document was created but chunking failed - still partial success
        return {
          success: true,
          documentId,
          textExtracted: true,
          textLength: extractedText.length,
          warning:
            'Text extracted but chunking failed - document may not be searchable',
        };
      }

      const processingTime = Date.now() - startTime;

      logger.info('File processed for RAG successfully', {
        fileId: args.fileId,
        documentId,
        textLength: extractedText.length,
        processingTime,
      });

      return {
        success: true,
        documentId,
        textExtracted: true,
        textLength: extractedText.length,
        processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      logger.error('Failed to process file for RAG', error, {
        fileId: args.fileId,
        messageId: args.messageId,
        processingTime,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime,
      };
    }
  },
});

/**
 * Extract text content from text files
 */
async function extractTextContent(ctx: any, file: any): Promise<string> {
  try {
    if (file.url) {
      // Fetch content from URL
      const response = await fetch(file.url);
      if (response.ok) {
        return await response.text();
      }
    }

    if (file.data) {
      // Decode base64 content
      const buffer = Buffer.from(file.data, 'base64');
      return buffer.toString('utf-8');
    }

    if (file.storageId) {
      // Get from Convex storage
      const blob = await ctx.storage.get(file.storageId as Id<'_storage'>);
      if (blob) {
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return buffer.toString('utf-8');
      }
    }

    return '';
  } catch (error) {
    logger.error('Failed to extract text content', error, {
      fileId: file.fileId,
    });
    return '';
  }
}

/**
 * Extract text content from PDF files
 * NOTE: PDF text extraction temporarily disabled - unpdf package removed due to Vercel deployment issues
 * TODO: Implement alternative PDF processing solution (e.g., pdf-parse, pdfjs-dist without canvas)
 */
async function extractPDFContent(_ctx: any, file: any): Promise<string> {
  try {
    // Temporary placeholder implementation
    // PDF files will be stored but text extraction is disabled

    logger.info('PDF text extraction temporarily disabled', {
      fileId: file.fileId,
      fileName: file.fileName,
    });

    // Return metadata indicating PDF processing is temporarily unavailable
    return `PDF Document: ${file.fileName}\n\nNote: PDF text extraction is temporarily unavailable. The PDF file has been stored and will be accessible for viewing, but text-based search and RAG features are currently disabled for PDF documents.\n\nPlease use text, markdown, or other supported file formats for searchable content.`;
  } catch (error) {
    logger.error('Failed to process PDF', error, {
      fileId: file.fileId,
    });

    // Return basic metadata on error
    return `PDF Document: ${file.fileName}\nError: Unable to process PDF - ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Handle image files - skip text extraction since images are handled visually by multi-modal models
 */
async function extractImageContent(
  _ctx: any,
  file: any,
  fileName: string
): Promise<string> {
  logger.info(
    'Skipping text extraction for image - will be handled visually by multi-modal models',
    {
      fileId: file.fileId,
      fileName,
    }
  );

  // Return empty string to indicate no text content to process for RAG
  // The image will be available visually to the AI model through the attachment system
  return '';
}

/**
 * Batch process multiple files from a message
 */
export const processMessageAttachments = action({
  args: {
    messageId: v.id('messages'),
    walletAddress: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    processed?: number;
    failed?: number;
    error?: string;
  }> => {
    try {
      // Get the message with attachments
      const message = await ctx.runQuery(api.messages.getById, {
        id: args.messageId,
      });

      if (!message) {
        return { success: false, error: 'Message not found' };
      }

      const metadata = message.metadata as any;
      const attachments = metadata?.attachments;

      if (!attachments || attachments.length === 0) {
        return { success: true, processed: 0 };
      }

      const results = [];

      // Process each attachment
      for (const attachment of attachments) {
        const result = await ctx.runAction(
          api.fileProcessing.processFileForRAG,
          {
            messageId: args.messageId,
            fileId: attachment.fileId,
            walletAddress: args.walletAddress,
            fileName: `file_${attachment.fileId}`,
            mimeType: attachment.mimeType,
          }
        );

        results.push({
          fileId: attachment.fileId,
          ...result,
        });
      }

      const successCount = results.filter((r) => r.success).length;

      logger.info('Batch processed message attachments', {
        messageId: args.messageId,
        totalFiles: attachments.length,
        successCount,
      });

      return {
        success: true,
        processed: successCount,
        failed: results.length - successCount,
      };
    } catch (error) {
      logger.error('Failed to batch process message attachments', error, {
        messageId: args.messageId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Validate file parameters before processing
 */
function validateFileForProcessing(args: {
  fileId: string;
  fileName: string;
  mimeType: string;
}): { isValid: boolean; error?: string } {
  // Validate required fields
  if (!(args.fileId && args.fileName && args.mimeType)) {
    return { isValid: false, error: 'Missing required file parameters' };
  }

  // Validate file name
  if (args.fileName.length > 255) {
    return { isValid: false, error: 'File name too long (max 255 characters)' };
  }

  // Check for potentially dangerous file names
  const dangerousPatterns = [/\.\.\//, /^\//, /\\/, /\0/];
  if (dangerousPatterns.some((pattern) => pattern.test(args.fileName))) {
    return { isValid: false, error: 'Invalid file name format' };
  }

  // Validate MIME type format
  if (
    !/^[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_.]*$/.test(
      args.mimeType
    )
  ) {
    return { isValid: false, error: 'Invalid MIME type format' };
  }

  return { isValid: true };
}

/**
 * Get appropriate timeout for content extraction based on file type
 */
function getExtractionTimeout(mimeType: string): number {
  if (mimeType.startsWith('text/') || mimeType.startsWith('application/json')) {
    return PROCESSING_TIMEOUTS.text;
  }
  if (mimeType === 'application/pdf') {
    return PROCESSING_TIMEOUTS.pdf;
  }
  if (mimeType.startsWith('image/')) {
    return PROCESSING_TIMEOUTS.image;
  }

  return PROCESSING_TIMEOUTS.default;
}

/**
 * Extract content by file type with unified error handling
 */
async function extractContentByType(
  ctx: any,
  file: any,
  args: {
    fileName: string;
    mimeType: string;
  }
): Promise<string> {
  if (
    args.mimeType.startsWith('text/') ||
    args.mimeType.startsWith('application/json')
  ) {
    return await extractTextContent(ctx, file);
  }
  if (args.mimeType === 'application/pdf') {
    return await extractPDFContent(ctx, file);
  }
  if (args.mimeType.startsWith('image/')) {
    return await extractImageContent(ctx, file, args.fileName);
  }
  // For unsupported file types, return metadata
  return `File: ${args.fileName} (${args.mimeType})\nUnsupported file type for content extraction.`;
}

/**
 * Get file type category for processing
 */
function getFileTypeCategory(mimeType: string): string {
  if (
    SUPPORTED_MIME_TYPES.text.includes(mimeType) ||
    SUPPORTED_MIME_TYPES.code.includes(mimeType)
  ) {
    return 'text';
  }
  if (SUPPORTED_MIME_TYPES.pdf.includes(mimeType)) {
    return 'pdf';
  }
  if (SUPPORTED_MIME_TYPES.image.includes(mimeType)) {
    return 'image';
  }

  return 'unknown';
}

/**
 * Check if file type is supported for content extraction
 */
function _isFileTypeSupported(mimeType: string): boolean {
  return getFileTypeCategory(mimeType) !== 'unknown';
}

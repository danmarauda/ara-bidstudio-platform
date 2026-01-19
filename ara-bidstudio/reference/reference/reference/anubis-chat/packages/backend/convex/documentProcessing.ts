/**
 * Document Processing for RAG Integration
 * Processes documents into searchable chunks with embeddings
 */

import { v } from 'convex/values';
import { api } from './_generated/api';
import { action } from './_generated/server';
import { createModuleLogger } from './utils/logger';

const logger = createModuleLogger('document-processing');

// Configuration for document chunking
const CHUNK_SIZE = 1000; // Characters per chunk
const CHUNK_OVERLAP = 200; // Overlapping characters between chunks
const MIN_CHUNK_SIZE = 100; // Minimum viable chunk size

/**
 * Process document into searchable chunks with embeddings
 */
export const processDocument = action({
  args: {
    documentId: v.id('documents'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { documentId, content } = args;

      if (!content.trim()) {
        logger.info('Empty content, skipping processing', { documentId });
        return { success: true, chunksCreated: 0 };
      }

      // Split content into chunks
      const chunks = splitIntoChunks(content, CHUNK_SIZE, CHUNK_OVERLAP);

      let chunksCreated = 0;

      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        if (chunk.length < MIN_CHUNK_SIZE) {
          continue; // Skip very small chunks
        }

        try {
          // Generate embedding for the chunk
          const embedding = await ctx.runAction(
            api.embeddings.generateEmbedding,
            {
              text: chunk,
            }
          );

          // Create document chunk with embedding
          await ctx.runMutation(api.documents.createChunk, {
            documentId,
            content: chunk,
            chunkIndex: i,
            embedding: embedding.embedding,
            metadata: {
              wordCount: chunk.split(/\s+/).length,
              startOffset: getStartPosition(chunks, i),
              endOffset: getStartPosition(chunks, i) + chunk.length,
            },
          });

          chunksCreated++;
        } catch (error) {
          logger.error('Failed to process chunk', error, {
            documentId,
            chunkIndex: i,
            chunkLength: chunk.length,
          });
        }
      }

      logger.info('Document processing completed', {
        documentId,
        totalChunks: chunks.length,
        chunksCreated,
        contentLength: content.length,
      });

      return {
        success: true,
        chunksCreated,
        totalChunks: chunks.length,
      };
    } catch (error) {
      logger.error('Document processing failed', error, {
        documentId: args.documentId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Split text content into overlapping chunks
 */
function splitIntoChunks(
  text: string,
  chunkSize: number,
  overlap: number
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Don't split in the middle of a word if possible
    if (end < text.length) {
      const nextSpace = text.indexOf(' ', end);
      const prevSpace = text.lastIndexOf(' ', end);

      // If we can find a space within reasonable distance, use it
      if (nextSpace !== -1 && nextSpace - end < 100) {
        end = nextSpace;
      } else if (prevSpace !== -1 && end - prevSpace < 100) {
        end = prevSpace;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move start position considering overlap
    start = Math.max(start + chunkSize - overlap, start + 1);

    // Prevent infinite loop
    if (start >= text.length) {
      break;
    }
  }

  return chunks;
}

/**
 * Calculate start position of a chunk in the original text
 */
function getStartPosition(chunks: string[], chunkIndex: number): number {
  let position = 0;
  for (let i = 0; i < chunkIndex; i++) {
    position += chunks[i].length;
  }
  return position;
}

/**
 * Reprocess all documents (maintenance utility)
 */
export const reprocessAllDocuments = action({
  args: {
    ownerId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    processedCount?: number;
    errorCount?: number;
    totalDocuments?: number;
    error?: string;
  }> => {
    try {
      const limit = args.limit || 50;

      // Get documents to reprocess
      const result = await ctx.runQuery(api.documents.getByOwner, {
        ownerId: args.ownerId || '',
        limit,
      });

      const documents = result.documents || [];
      let processedCount = 0;
      let errorCount = 0;

      for (const doc of documents) {
        try {
          // Delete existing chunks
          await ctx.runMutation(api.documents.deleteChunks, {
            documentId: doc._id,
          });

          // Get document content (this would need to be implemented based on your document storage)
          const content = await getDocumentContent(ctx, doc);

          if (content) {
            const result = await ctx.runAction(
              api.documentProcessing.processDocument,
              {
                documentId: doc._id,
                content,
              }
            );

            if (result.success) {
              processedCount++;
            } else {
              errorCount++;
            }
          }
        } catch (error) {
          logger.error('Failed to reprocess document', error, {
            documentId: doc._id,
          });
          errorCount++;
        }
      }

      return {
        success: true,
        processedCount,
        errorCount,
        totalDocuments: documents.length,
      };
    } catch (error) {
      logger.error('Batch reprocessing failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Get document content for reprocessing
 * This is a placeholder - implement based on your document storage strategy
 */
async function getDocumentContent(
  _ctx: any,
  document: any
): Promise<string | null> {
  try {
    // This would depend on how documents are stored
    // For file uploads, you might need to fetch from storage
    // For now, return empty string as placeholder
    logger.info('Document content retrieval not implemented', {
      documentId: document._id,
    });
    return null;
  } catch (error) {
    logger.error('Failed to get document content', error, {
      documentId: document._id,
    });
    return null;
  }
}

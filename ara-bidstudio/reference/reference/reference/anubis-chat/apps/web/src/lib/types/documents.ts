/**
 * Document Management Type Definitions
 * Comprehensive TypeScript definitions for document storage and RAG system
 */

// =============================================================================
// Core Document Types
// =============================================================================

export type DocumentType = 'text' | 'markdown' | 'pdf' | 'url' | 'json' | 'csv';

export interface DocumentMetadata {
  source?: string;
  author?: string;
  tags?: string[];
  category?: string;
  language?: string;
  wordCount?: number;
  characterCount?: number;
  // Vector search metadata (for future RAG integration)
  embedding?: number[];
  chunkIds?: string[];
}

export interface Document {
  id: string;
  title: string;
  content: string;
  type: DocumentType;
  ownerId: string; // wallet address
  metadata?: DocumentMetadata;
  createdAt: number;
  updatedAt: number;
}

// =============================================================================
// Document Chunk Types (for RAG system)
// =============================================================================

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  embedding?: number[];
  metadata: {
    chunkIndex: number;
    startChar: number;
    endChar: number;
    wordCount: number;
    overlap?: boolean;
  };
  createdAt: number;
}

// =============================================================================
// Request/Response Types
// =============================================================================

export interface DocumentUploadRequest {
  title: string;
  content: string;
  type?: DocumentType;
  metadata?: Omit<
    DocumentMetadata,
    'wordCount' | 'characterCount' | 'embedding' | 'chunkIds'
  >;
}

export interface DocumentUpdateRequest {
  title?: string;
  content?: string;
  metadata?: Omit<
    DocumentMetadata,
    'wordCount' | 'characterCount' | 'embedding' | 'chunkIds'
  >;
}

export interface DocumentUploadResponse {
  document: Document;
  message: string;
}

export interface DocumentUpdateResponse {
  document: Document;
  message: string;
}

// =============================================================================
// Pagination Types
// =============================================================================

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface DocumentFilters {
  category?: string | null;
  search?: string | null;
  type?: DocumentType | null;
  tags?: string[] | null;
}

export interface DocumentListResponse {
  documents: Document[];
  pagination: PaginationInfo;
  filters: DocumentFilters;
}

// =============================================================================
// Search and RAG Types
// =============================================================================

export interface DocumentSearchRequest {
  query: string;
  limit?: number;
  filters?: {
    type?: DocumentType[];
    category?: string[];
    tags?: string[];
    ownerId?: string;
  };
  // RAG-specific parameters
  similarity?: {
    threshold?: number; // minimum similarity score (0-1)
    algorithm?: 'cosine' | 'dot_product' | 'euclidean';
  };
  rerank?: {
    enabled?: boolean;
    model?: string;
    topK?: number;
  };
}

export interface DocumentSearchResult {
  document: Document;
  chunk?: DocumentChunk;
  score: number;
  highlights?: {
    title?: string[];
    content?: string[];
  };
}

export interface DocumentSearchResponse {
  results: DocumentSearchResult[];
  query: string;
  total: number;
  processingTime: number;
  filters: DocumentSearchRequest['filters'];
}

// =============================================================================
// Vector Store Integration Types
// =============================================================================

export interface VectorSearchQuery {
  vector: number[];
  limit?: number;
  filter?: Record<string, unknown>;
  threshold?: number;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
  payload?: Record<string, unknown>;
}

// =============================================================================
// Document Processing Types
// =============================================================================

export interface ProcessingJob {
  id: string;
  documentId: string;
  type: 'embedding' | 'chunking' | 'indexing';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  error?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface ChunkingOptions {
  maxChunkSize?: number; // default: 1000 characters
  overlapSize?: number; // default: 200 characters
  separator?: string; // default: '\n\n'
  preserveStructure?: boolean; // preserve markdown/html structure
}

export interface EmbeddingOptions {
  model?: string; // embedding model to use
  dimensions?: number; // embedding dimensions
  batchSize?: number; // batch processing size
}

// =============================================================================
// Statistics and Analytics Types
// =============================================================================

export interface DocumentStats {
  totalDocuments: number;
  totalSize: number; // in characters
  averageSize: number;
  byType: Record<DocumentType, number>;
  byCategory: Record<string, number>;
  recentUploads: number; // last 7 days
}

export interface UserDocumentStats {
  ownerId: string;
  stats: DocumentStats;
  storageUsed: number; // in bytes
  storageLimit: number; // in bytes
  lastActivity: number;
}

// =============================================================================
// Configuration Types
// =============================================================================

export interface DocumentConfig {
  maxFileSize: number; // in bytes
  maxDocuments: number;
  allowedTypes: DocumentType[];
  chunkingOptions: ChunkingOptions;
  embeddingOptions: EmbeddingOptions;
  vectorStore: {
    provider: 'qdrant' | 'pinecone' | 'weaviate' | 'memory';
    config: Record<string, unknown>;
  };
}

// =============================================================================
// Error Types
// =============================================================================

export interface DocumentError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  documentId?: string;
}

export type DocumentErrorCode =
  | 'DOCUMENT_NOT_FOUND'
  | 'DOCUMENT_TOO_LARGE'
  | 'INVALID_TYPE'
  | 'PROCESSING_FAILED'
  | 'STORAGE_LIMIT_EXCEEDED'
  | 'EMBEDDING_FAILED'
  | 'CHUNKING_FAILED'
  | 'VECTOR_STORE_ERROR';

// =============================================================================
// Utility Types
// =============================================================================

export type DocumentWithChunks = Document & {
  chunks?: DocumentChunk[];
};

export type DocumentSummary = Omit<Document, 'content'> & {
  contentPreview: string; // first 200 characters
  chunkCount?: number;
};

// Generic API response wrapper for documents
export interface DocumentAPIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: DocumentError;
}

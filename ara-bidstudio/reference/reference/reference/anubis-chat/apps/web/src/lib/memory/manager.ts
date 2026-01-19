/**
 * Memory and Context Management System
 * Handles conversation memory, context windows, and embeddings
 */

import type { ModelMessage, UIMessage } from 'ai';
import { v4 as uuidv4 } from 'uuid';

// Memory Types
export type MemoryType =
  | 'short-term'
  | 'long-term'
  | 'episodic'
  | 'semantic'
  | 'procedural';

// Memory Entry
export interface MemoryEntry {
  id: string;
  type: MemoryType;
  content: string;
  embedding?: number[];
  metadata: {
    timestamp: number;
    conversationId?: string;
    userId?: string;
    importance: number; // 0-1 score
    accessCount: number;
    lastAccessed?: number;
    tags?: string[];
    relationships?: string[]; // IDs of related memories
  };
}

// Conversation Context
export interface ConversationContext {
  id: string;
  messages: UIMessage[];
  modelMessages?: ModelMessage[]; // For AI SDK compatibility
  summary?: string;
  topics: string[];
  entities: Entity[];
  sentiment: number; // -1 to 1
  metadata: {
    startTime: number;
    lastUpdateTime: number;
    participantIds: string[];
    turnCount: number;
  };
}

// Entity Recognition
export interface Entity {
  id: string;
  type: 'person' | 'place' | 'organization' | 'concept' | 'event';
  name: string;
  mentions: number;
  context: string[];
  relationships: Array<{
    entityId: string;
    relationship: string;
  }>;
}

// Memory Search Options
export interface MemorySearchOptions {
  query?: string;
  type?: MemoryType;
  conversationId?: string;
  userId?: string;
  startTime?: number;
  endTime?: number;
  minImportance?: number;
  tags?: string[];
  limit?: number;
  includeEmbeddings?: boolean;
}

// Context Window Manager
export class ContextWindowManager {
  private maxTokens: number;
  private compressionRatio: number;

  constructor(maxTokens = 128_000, compressionRatio = 0.3) {
    this.maxTokens = maxTokens;
    this.compressionRatio = compressionRatio;
  }

  /**
   * Manage context window for messages
   */
  async manageContext(
    messages: UIMessage[],
    newMessage?: UIMessage
  ): Promise<UIMessage[]> {
    const allMessages = newMessage ? [...messages, newMessage] : messages;
    const tokenCount = this.estimateTokens(allMessages);

    if (tokenCount <= this.maxTokens) {
      return allMessages;
    }

    // Apply compression strategies
    return this.compressContext(allMessages);
  }

  /**
   * Compress context using various strategies
   */
  private async compressContext(messages: UIMessage[]): Promise<UIMessage[]> {
    // Strategy 1: Remove less important messages
    const importantMessages = this.filterImportantMessages(messages);

    if (this.estimateTokens(importantMessages) <= this.maxTokens) {
      return importantMessages;
    }

    // Strategy 2: Summarize older messages
    const summarized = await this.summarizeOldMessages(importantMessages);

    if (this.estimateTokens(summarized) <= this.maxTokens) {
      return summarized;
    }

    // Strategy 3: Sliding window
    return this.applySlidingWindow(summarized);
  }

  /**
   * Filter messages by importance
   */
  private filterImportantMessages(messages: UIMessage[]): UIMessage[] {
    // Keep system messages and recent messages
    const systemMessages = messages.filter((m) => m.role === 'system');
    const recentMessages = messages.slice(-Math.floor(messages.length * 0.7));

    return [...systemMessages, ...recentMessages];
  }

  /**
   * Summarize older messages
   */
  private async summarizeOldMessages(
    messages: UIMessage[]
  ): Promise<UIMessage[]> {
    const cutoff = Math.floor(messages.length * 0.3);
    const oldMessages = messages.slice(0, cutoff);
    const recentMessages = messages.slice(cutoff);

    if (oldMessages.length === 0) {
      return messages;
    }

    // Create summary of old messages
    const summary: UIMessage = {
      id: uuidv4(),
      role: 'system',
      parts: [
        {
          type: 'text',
          text: `[Summary of previous ${oldMessages.length} messages: ${this.createSummary(oldMessages)}]`,
        },
      ],
    };

    return [summary, ...recentMessages];
  }

  /**
   * Apply sliding window to messages
   */
  private applySlidingWindow(messages: UIMessage[]): UIMessage[] {
    const systemMessages = messages.filter((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    // Keep system messages and recent non-system messages
    const windowSize = Math.floor(this.maxTokens / 100); // Rough estimate
    const windowed = nonSystemMessages.slice(-windowSize);

    return [...systemMessages, ...windowed];
  }

  /**
   * Create summary of messages
   */
  private createSummary(messages: UIMessage[]): string {
    // Simple summary - in production, use LLM for better summaries
    const topics = new Set<string>();

    for (const msg of messages) {
      // Extract text content from UI message parts
      const textParts = msg.parts?.filter((part) => part.type === 'text') || [];
      const content = textParts.map((part: any) => part.text || '').join(' ');

      // Extract simple topics (words > 4 chars)
      const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
      words.slice(0, 10).forEach((word) => topics.add(word));
    }

    return `Topics discussed: ${Array.from(topics).slice(0, 5).join(', ')}`;
  }

  /**
   * Estimate token count for messages
   */
  private estimateTokens(messages: UIMessage[]): number {
    // Rough estimation: 1 token ≈ 4 characters
    const totalChars = messages.reduce((sum, msg) => {
      // Extract text content from UI message parts
      const textParts = msg.parts?.filter((part) => part.type === 'text') || [];
      const content = textParts.map((part: any) => part.text || '').join(' ');
      return sum + content.length;
    }, 0);

    return Math.ceil(totalChars / 4);
  }
}

// Memory Manager
export class MemoryManager {
  private memories: Map<string, MemoryEntry> = new Map();
  private conversations: Map<string, ConversationContext> = new Map();
  private contextManager: ContextWindowManager;
  private embeddingCache: Map<string, number[]> = new Map();

  constructor(contextManager?: ContextWindowManager) {
    this.contextManager = contextManager || new ContextWindowManager();
  }

  /**
   * Store a memory
   */
  async storeMemory(
    type: MemoryType,
    content: string,
    metadata?: Partial<MemoryEntry['metadata']>
  ): Promise<MemoryEntry> {
    const id = uuidv4();
    const entry: MemoryEntry = {
      id,
      type,
      content,
      metadata: {
        timestamp: Date.now(),
        importance: metadata?.importance || 0.5,
        accessCount: 0,
        ...metadata,
      },
    };

    // Generate embedding (placeholder - integrate with embedding service)
    entry.embedding = await this.generateEmbedding(content);

    this.memories.set(id, entry);
    return entry;
  }

  /**
   * Retrieve memories
   */
  async retrieveMemories(options: MemorySearchOptions): Promise<MemoryEntry[]> {
    let results = Array.from(this.memories.values());

    // Filter by type
    if (options.type) {
      results = results.filter((m) => m.type === options.type);
    }

    // Filter by conversation
    if (options.conversationId) {
      results = results.filter(
        (m) => m.metadata.conversationId === options.conversationId
      );
    }

    // Filter by user
    if (options.userId) {
      results = results.filter((m) => m.metadata.userId === options.userId);
    }

    // Filter by time range
    if (options.startTime) {
      results = results.filter(
        (m) => m.metadata.timestamp >= options.startTime!
      );
    }
    if (options.endTime) {
      results = results.filter((m) => m.metadata.timestamp <= options.endTime!);
    }

    // Filter by importance
    if (options.minImportance) {
      results = results.filter(
        (m) => m.metadata.importance >= options.minImportance!
      );
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      results = results.filter((m) =>
        m.metadata.tags?.some((tag) => options.tags?.includes(tag))
      );
    }

    // Semantic search if query provided
    if (options.query) {
      results = await this.semanticSearch(
        results,
        options.query,
        options.limit
      );
    }

    // Sort by relevance/timestamp
    results.sort((a, b) => b.metadata.timestamp - a.metadata.timestamp);

    // Apply limit
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    // Update access counts
    for (const memory of results) {
      memory.metadata.accessCount++;
      memory.metadata.lastAccessed = Date.now();
    }

    return results;
  }

  /**
   * Semantic search through memories
   */
  private async semanticSearch(
    memories: MemoryEntry[],
    query: string,
    limit?: number
  ): Promise<MemoryEntry[]> {
    const queryEmbedding = await this.generateEmbedding(query);

    // Calculate similarities
    const memoriesWithScores = memories.map((memory) => {
      const similarity = memory.embedding
        ? this.cosineSimilarity(queryEmbedding, memory.embedding)
        : 0;
      return { memory, similarity };
    });

    // Sort by similarity
    memoriesWithScores.sort((a, b) => b.similarity - a.similarity);

    // Return top results
    const topResults = limit
      ? memoriesWithScores.slice(0, limit)
      : memoriesWithScores.filter((m) => m.similarity > 0.7);

    return topResults.map((r) => r.memory);
  }

  /**
   * Calculate cosine similarity between embeddings
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Generate embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Check cache
    if (this.embeddingCache.has(text)) {
      return this.embeddingCache.get(text)!;
    }

    // Placeholder - integrate with actual embedding service
    // In production, use OpenAI embeddings or similar
    const embedding = Array.from({ length: 1536 }, () => Math.random());

    this.embeddingCache.set(text, embedding);
    return embedding;
  }

  /**
   * Extract text content from UIMessage parts structure
   */
  private extractUIMessageContent(message: UIMessage): string {
    if (!message.parts) {
      return '';
    }

    const textParts = message.parts.filter((part) => part.type === 'text');
    return textParts.map((part: any) => part.text || '').join(' ');
  }

  /**
   * Update conversation context
   */
  async updateConversation(
    conversationId: string,
    messages: UIMessage[]
  ): Promise<ConversationContext> {
    let context = this.conversations.get(conversationId);

    if (!context) {
      context = {
        id: conversationId,
        messages: [],
        topics: [],
        entities: [],
        sentiment: 0,
        metadata: {
          startTime: Date.now(),
          lastUpdateTime: Date.now(),
          participantIds: [],
          turnCount: 0,
        },
      };
      this.conversations.set(conversationId, context);
    }

    // Update messages with context management
    context.messages = await this.contextManager.manageContext(
      context.messages,
      messages.at(-1)
    );

    // Convert UIMessages to ModelMessages for analysis functions
    const modelMessages: ModelMessage[] = messages.map((msg) => ({
      role: msg.role,
      content: this.extractUIMessageContent(msg),
    }));

    // Extract topics and entities using converted messages
    context.topics = await this.extractTopics(modelMessages);
    context.entities = await this.extractEntities(modelMessages);

    // Update sentiment
    context.sentiment = await this.analyzeSentiment(modelMessages);

    // Update metadata
    context.metadata.lastUpdateTime = Date.now();
    context.metadata.turnCount = messages.length;

    // Store important messages as memories
    for (const message of messages) {
      // Convert UIMessage to ModelMessage for importance check
      const modelMessage: ModelMessage = {
        role: message.role,
        content: this.extractUIMessageContent(message),
      };

      if (this.isImportantMessage(modelMessage)) {
        await this.storeMemory(
          'episodic',
          this.extractUIMessageContent(message),
          {
            conversationId,
            importance: 0.7,
          }
        );
      }
    }

    return context;
  }

  /**
   * Check if a message is important
   */
  private isImportantMessage(message: ModelMessage): boolean {
    // Simple heuristic - in production, use more sophisticated analysis
    const content =
      typeof message.content === 'string'
        ? message.content
        : JSON.stringify(message.content);
    return (
      content.length > 100 ||
      content.includes('important') ||
      content.includes('remember')
    );
  }

  /**
   * Extract topics from messages
   */
  private async extractTopics(messages: ModelMessage[]): Promise<string[]> {
    // Placeholder - integrate with NLP service
    const topics = new Set<string>();

    for (const msg of messages) {
      const content =
        typeof msg.content === 'string'
          ? msg.content
          : JSON.stringify(msg.content);
      // Simple keyword extraction
      const words = content.split(' ').filter((w: string) => w.length > 5);
      for (const word of words.slice(0, 3)) {
        topics.add(word);
      }
    }

    return Array.from(topics);
  }

  /**
   * Extract entities from messages
   */
  private async extractEntities(messages: ModelMessage[]): Promise<Entity[]> {
    // Placeholder - integrate with NER service
    const entities: Entity[] = [];

    // Simple entity extraction
    for (const msg of messages) {
      const content =
        typeof msg.content === 'string'
          ? msg.content
          : JSON.stringify(msg.content);
      // Look for capitalized words as potential entities
      const matches = content.match(/[A-Z][a-z]+/g) || [];

      for (const match of matches) {
        const existing = entities.find((e) => e.name === match);
        if (existing) {
          existing.mentions++;
        } else {
          entities.push({
            id: uuidv4(),
            type: 'concept',
            name: match,
            mentions: 1,
            context: [content.substring(0, 100)],
            relationships: [],
          });
        }
      }
    }

    return entities;
  }

  /**
   * Analyze sentiment of messages
   */
  private async analyzeSentiment(_messages: ModelMessage[]): Promise<number> {
    // Placeholder - integrate with sentiment analysis service
    // Return value between -1 (negative) and 1 (positive)
    return 0;
  }

  /**
   * Clear old memories based on retention policy
   */
  async clearOldMemories(retentionDays = 30): Promise<number> {
    const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    let cleared = 0;

    this.memories.forEach((memory, id) => {
      if (
        memory.metadata.timestamp < cutoffTime &&
        memory.metadata.importance < 0.8
      ) {
        this.memories.delete(id);
        cleared++;
      }
    });

    return cleared;
  }

  /**
   * Export memories
   */
  exportMemories(): {
    memories: MemoryEntry[];
    conversations: ConversationContext[];
  } {
    return {
      memories: Array.from(this.memories.values()),
      conversations: Array.from(this.conversations.values()),
    };
  }

  /**
   * Import memories
   */
  importMemories(data: {
    memories: MemoryEntry[];
    conversations: ConversationContext[];
  }): void {
    for (const memory of data.memories) {
      this.memories.set(memory.id, memory);
    }

    for (const conversation of data.conversations) {
      this.conversations.set(conversation.id, conversation);
    }
  }
}

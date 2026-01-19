/**
 * Memory Store
 * In-memory storage for conversation context and memory
 */

import { nanoid } from 'nanoid';

// =============================================================================
// Types
// =============================================================================

export interface Memory {
  id: string;
  userId: string;
  type: 'conversation' | 'fact' | 'preference' | 'context';
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
  createdAt: number;
  updatedAt: number;
  accessCount: number;
  lastAccessedAt: number;
}

export interface ConversationContext {
  id: string;
  userId: string;
  messages: ConversationMessage[];
  memories: string[]; // Memory IDs
  startedAt: number;
  lastMessageAt: number;
  metadata?: Record<string, any>;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// =============================================================================
// Memory Store Class
// =============================================================================

export class MemoryStore {
  private memories = new Map<string, Memory>();
  private userMemories = new Map<string, Set<string>>(); // userId -> Set<memoryId>
  private conversations = new Map<string, ConversationContext>();
  private userConversations = new Map<string, Set<string>>(); // userId -> Set<conversationId>

  // Memory Management
  // ----------------

  /**
   * Add a memory
   */
  addMemory(
    userId: string,
    type: Memory['type'],
    content: string,
    metadata?: Record<string, any>
  ): Memory {
    const memory: Memory = {
      id: nanoid(),
      userId,
      type,
      content,
      metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      accessCount: 0,
      lastAccessedAt: Date.now(),
    };

    this.memories.set(memory.id, memory);

    // Add to user's memory index
    if (!this.userMemories.has(userId)) {
      this.userMemories.set(userId, new Set());
    }
    this.userMemories.get(userId)?.add(memory.id);

    return memory;
  }

  /**
   * Get a memory by ID
   */
  getMemory(memoryId: string): Memory | undefined {
    const memory = this.memories.get(memoryId);
    if (memory) {
      // Update access tracking
      memory.accessCount++;
      memory.lastAccessedAt = Date.now();
    }
    return memory;
  }

  /**
   * Get all memories for a user
   */
  getUserMemories(userId: string, type?: Memory['type']): Memory[] {
    const memoryIds = this.userMemories.get(userId);
    if (!memoryIds) {
      return [];
    }

    const memories = Array.from(memoryIds)
      .map((id) => this.memories.get(id))
      .filter((m): m is Memory => m !== undefined);

    if (type) {
      return memories.filter((m) => m.type === type);
    }

    return memories;
  }

  /**
   * Search memories by content
   */
  searchMemories(userId: string, query: string, limit = 10): Memory[] {
    const memories = this.getUserMemories(userId);
    const queryLower = query.toLowerCase();

    // Simple text search - in production, use vector search
    const results = memories
      .filter((m) => m.content.toLowerCase().includes(queryLower))
      .sort((a, b) => {
        // Sort by relevance (simple heuristic: more recent and more accessed)
        const scoreA = a.lastAccessedAt + a.accessCount * 1000;
        const scoreB = b.lastAccessedAt + b.accessCount * 1000;
        return scoreB - scoreA;
      })
      .slice(0, limit);

    // Update access counts
    for (const m of results) {
      m.accessCount++;
      m.lastAccessedAt = Date.now();
    }

    return results;
  }

  /**
   * Update a memory
   */
  updateMemory(
    memoryId: string,
    content: string,
    metadata?: Record<string, any>
  ): Memory | undefined {
    const memory = this.memories.get(memoryId);
    if (!memory) {
      return;
    }

    memory.content = content;
    if (metadata) {
      memory.metadata = { ...memory.metadata, ...metadata };
    }
    memory.updatedAt = Date.now();

    return memory;
  }

  /**
   * Delete a memory
   */
  deleteMemory(memoryId: string): boolean {
    const memory = this.memories.get(memoryId);
    if (!memory) {
      return false;
    }

    // Remove from user's memory index
    const userMemories = this.userMemories.get(memory.userId);
    if (userMemories) {
      userMemories.delete(memoryId);
    }

    return this.memories.delete(memoryId);
  }

  // Conversation Management
  // -----------------------

  /**
   * Create a new conversation
   */
  createConversation(
    userId: string,
    metadata?: Record<string, any>
  ): ConversationContext {
    const conversation: ConversationContext = {
      id: nanoid(),
      userId,
      messages: [],
      memories: [],
      startedAt: Date.now(),
      lastMessageAt: Date.now(),
      metadata,
    };

    this.conversations.set(conversation.id, conversation);

    // Add to user's conversation index
    if (!this.userConversations.has(userId)) {
      this.userConversations.set(userId, new Set());
    }
    this.userConversations.get(userId)?.add(conversation.id);

    return conversation;
  }

  /**
   * Get a conversation by ID
   */
  getConversation(conversationId: string): ConversationContext | undefined {
    return this.conversations.get(conversationId);
  }

  /**
   * Get all conversations for a user
   */
  getUserConversations(userId: string): ConversationContext[] {
    const conversationIds = this.userConversations.get(userId);
    if (!conversationIds) {
      return [];
    }

    return Array.from(conversationIds)
      .map((id) => this.conversations.get(id))
      .filter((c): c is ConversationContext => c !== undefined)
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt); // Most recent first
  }

  /**
   * Get conversations for a user with efficient pagination
   * @param userId - User identifier
   * @param options - Pagination options
   * @returns Paginated conversations with metadata
   */
  getUserConversationsPaginated(
    userId: string,
    options: {
      limit: number;
      offset?: number;
      cursor?: string;
    }
  ): {
    conversations: ConversationContext[];
    pagination: {
      total: number;
      hasMore: boolean;
      nextCursor?: string;
      nextOffset: number;
    };
  } {
    const conversationIds = this.userConversations.get(userId);
    if (!conversationIds) {
      return {
        conversations: [],
        pagination: {
          total: 0,
          hasMore: false,
          nextOffset: 0,
        },
      };
    }

    // Get all conversations and sort by most recent first
    const allConversations = Array.from(conversationIds)
      .map((id) => this.conversations.get(id))
      .filter((c): c is ConversationContext => c !== undefined)
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);

    const total = allConversations.length;
    const offset = options.offset || 0;
    const limit = options.limit;

    // Handle cursor-based pagination
    let startIndex = offset;
    if (options.cursor) {
      // Find the conversation after the cursor
      const cursorIndex = allConversations.findIndex(
        (c) => c.id === options.cursor
      );
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    // Apply pagination
    const paginatedConversations = allConversations.slice(
      startIndex,
      startIndex + limit
    );
    const hasMore = startIndex + limit < total;

    // Generate next cursor (ID of last conversation in current page)
    const nextCursor =
      paginatedConversations.length > 0
        ? paginatedConversations.at(-1)?.id
        : undefined;

    return {
      conversations: paginatedConversations,
      pagination: {
        total,
        hasMore,
        nextCursor: hasMore ? nextCursor : undefined,
        nextOffset: startIndex + limit,
      },
    };
  }

  /**
   * Add a message to a conversation
   */
  addMessage(
    conversationId: string,
    role: ConversationMessage['role'],
    content: string,
    metadata?: Record<string, any>
  ): ConversationMessage | undefined {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return;
    }

    const message: ConversationMessage = {
      role,
      content,
      timestamp: Date.now(),
      metadata,
    };

    conversation.messages.push(message);
    conversation.lastMessageAt = Date.now();

    // Extract important information as memories
    if (role === 'user') {
      this.extractMemoriesFromMessage(conversation.userId, content);
    }

    return message;
  }

  /**
   * Link a memory to a conversation
   */
  linkMemoryToConversation(conversationId: string, memoryId: string): boolean {
    const conversation = this.conversations.get(conversationId);
    const memory = this.memories.get(memoryId);

    if (!(conversation && memory)) {
      return false;
    }

    if (!conversation.memories.includes(memoryId)) {
      conversation.memories.push(memoryId);
    }

    return true;
  }

  /**
   * Get memories linked to a conversation
   */
  getConversationMemories(conversationId: string): Memory[] {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return [];
    }

    return conversation.memories
      .map((id) => this.memories.get(id))
      .filter((m): m is Memory => m !== undefined);
  }

  // Private Methods
  // --------------

  /**
   * Extract memories from a message (simple heuristic)
   */
  private extractMemoriesFromMessage(userId: string, content: string): void {
    // Look for patterns that indicate facts or preferences
    const patterns = [
      /my name is (\w+)/i,
      /i prefer (\w+)/i,
      /i like (\w+)/i,
      /i work at (\w+)/i,
      /i live in (\w+)/i,
      /my favorite (\w+) is (\w+)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        // Create a fact or preference memory
        const type =
          pattern.source.includes('prefer') ||
          pattern.source.includes('like') ||
          pattern.source.includes('favorite')
            ? 'preference'
            : 'fact';

        this.addMemory(userId, type, match[0], {
          extractedFrom: 'conversation',
          pattern: pattern.source,
        });
      }
    }
  }

  // Utility Methods
  // --------------

  /**
   * Clear all data (useful for testing)
   */
  clear(): void {
    this.memories.clear();
    this.userMemories.clear();
    this.conversations.clear();
    this.userConversations.clear();
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalMemories: number;
    totalConversations: number;
    totalUsers: number;
  } {
    return {
      totalMemories: this.memories.size,
      totalConversations: this.conversations.size,
      totalUsers: this.userMemories.size,
    };
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const memoryStore = new MemoryStore();

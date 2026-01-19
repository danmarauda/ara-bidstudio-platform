/**
 * Memory types and interfaces for the ANUBIS Chat memory system
 */

import type { Doc, Id } from '@convex/_generated/dataModel';

export type Memory = Doc<'memories'>;
export type MemoryId = Id<'memories'>;

export type MemoryType = 'fact' | 'preference' | 'skill' | 'goal' | 'context';
export type MemorySourceType = 'chat' | 'document' | 'agent' | 'workflow';

export interface MemoryStats {
  total: number;
  byType: Record<MemoryType, number>;
  totalAccesses: number;
  averageImportance: number;
}

export interface CreateMemoryData {
  content: string;
  type: MemoryType;
  importance?: number;
  tags?: string[];
  sourceId?: string;
  sourceType?: MemorySourceType;
}

export interface UpdateMemoryData {
  content?: string;
  type?: MemoryType;
  importance?: number;
  tags?: string[];
}

export interface MemoryFilters {
  type?: MemoryType;
  search?: string;
  sortBy?: 'importance' | 'createdAt' | 'lastAccessed' | 'accessCount';
  sortOrder?: 'asc' | 'desc';
}

export interface MemoryTypeConfig {
  label: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const memoryTypeConfigs: Record<MemoryType, MemoryTypeConfig> = {
  fact: {
    label: 'Fact',
    description: 'Factual information and data',
    icon: '📚',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  preference: {
    label: 'Preference',
    description: 'User preferences and choices',
    icon: '❤️',
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-900/20',
    borderColor: 'border-pink-200 dark:border-pink-800',
  },
  skill: {
    label: 'Skill',
    description: 'Abilities and competencies',
    icon: '🎯',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  goal: {
    label: 'Goal',
    description: 'Objectives and aspirations',
    icon: '🎯',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  context: {
    label: 'Context',
    description: 'Situational information and background',
    icon: '🔗',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
};

// Type guards
export function isValidMemoryType(type: string): type is MemoryType {
  return ['fact', 'preference', 'skill', 'goal', 'context'].includes(type);
}

export function isValidSourceType(type: string): type is MemorySourceType {
  return ['chat', 'document', 'agent', 'workflow'].includes(type);
}

// Utility functions
export function getMemoryTypeConfig(type: MemoryType): MemoryTypeConfig {
  return memoryTypeConfigs[type];
}

export function formatImportanceScore(importance: number): string {
  return `${Math.round(importance * 100)}%`;
}

export function getImportanceColor(importance: number): string {
  if (importance >= 0.8) {
    return 'text-red-600 dark:text-red-400';
  }
  if (importance >= 0.6) {
    return 'text-orange-600 dark:text-orange-400';
  }
  if (importance >= 0.4) {
    return 'text-yellow-600 dark:text-yellow-400';
  }
  return 'text-gray-600 dark:text-gray-400';
}

export function getImportanceStars(importance: number): number {
  return Math.round(importance * 5);
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
  if (months > 0) {
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

export function generateMemoryId(): string {
  return `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Export/Import types
export interface MemoryExportData {
  version: string;
  exportDate: string;
  userWalletAddress: string;
  memories: Memory[];
  stats: MemoryStats;
}

export interface MemoryImportData {
  memories: Omit<Memory, '_id' | '_creationTime' | 'userId'>[];
}

// Search and filtering utilities
export function filterMemories(
  memories: Memory[],
  filters: MemoryFilters
): Memory[] {
  let filtered = [...memories];

  // Filter by type
  if (filters.type) {
    filtered = filtered.filter((memory) => memory.type === filters.type);
  }

  // Filter by search term
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (memory) =>
        memory.content.toLowerCase().includes(searchLower) ||
        memory.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  }

  // Sort memories
  if (filters.sortBy) {
    filtered.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (filters.sortBy) {
        case 'importance':
          aVal = a.importance;
          bVal = b.importance;
          break;
        case 'createdAt':
          aVal = a.createdAt;
          bVal = b.createdAt;
          break;
        case 'lastAccessed':
          aVal = a.lastAccessed || 0;
          bVal = b.lastAccessed || 0;
          break;
        case 'accessCount':
          aVal = a.accessCount;
          bVal = b.accessCount;
          break;
        default:
          aVal = a.createdAt;
          bVal = b.createdAt;
      }

      if (filters.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
  }

  return filtered;
}

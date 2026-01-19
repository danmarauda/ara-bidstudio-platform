/**
 * Enhanced Reasoning System for ANUBIS Chat
 * 
 * This module provides advanced reasoning capabilities without the overhead
 * of MCP servers, optimized for serverless deployment on Vercel/Convex.
 */

import { createModuleLogger } from '../../utils/logger';

const logger = createModuleLogger('enhancedReasoning');

// =============================================================================
// Types
// =============================================================================

export interface ReasoningStep {
  thought: string;
  confidence: number;
  evidence?: string[];
  nextStepNeeded: boolean;
}

export interface ReasoningChain {
  steps: ReasoningStep[];
  conclusion?: string;
  totalConfidence: number;
}

export interface ReasoningConfig {
  maxSteps?: number;
  minConfidence?: number;
  requireEvidence?: boolean;
  model?: 'fast' | 'deep' | 'adaptive';
}

// =============================================================================
// Enhanced Reasoning Implementation
// =============================================================================

/**
 * Sequential reasoning without MCP overhead
 * Implements chain-of-thought directly in Convex functions
 */
export class EnhancedReasoningSystem {
  private config: Required<ReasoningConfig>;

  constructor(config: ReasoningConfig = {}) {
    this.config = {
      maxSteps: config.maxSteps ?? 5,
      minConfidence: config.minConfidence ?? 0.7,
      requireEvidence: config.requireEvidence ?? false,
      model: config.model ?? 'adaptive',
    };
  }

  /**
   * Generate reasoning prompt for AI model
   */
  generateReasoningPrompt(query: string, context?: string): string {
    const prompts = {
      fast: this.getFastReasoningPrompt(query, context),
      deep: this.getDeepReasoningPrompt(query, context),
      adaptive: this.getAdaptiveReasoningPrompt(query, context),
    };

    return prompts[this.config.model];
  }

  /**
   * Fast reasoning - minimal overhead
   */
  private getFastReasoningPrompt(query: string, context?: string): string {
    return `Think step-by-step about: ${query}
${context ? `Context: ${context}` : ''}

Provide a concise answer with your reasoning in 2-3 steps.`;
  }

  /**
   * Deep reasoning - comprehensive analysis
   */
  private getDeepReasoningPrompt(query: string, context?: string): string {
    return `Analyze this systematically: ${query}
${context ? `Context: ${context}` : ''}

Follow this structure:
1. Break down the problem
2. Consider multiple perspectives
3. Evaluate evidence
4. Draw conclusions
5. Identify uncertainties

Think through each step carefully before responding.`;
  }

  /**
   * Adaptive reasoning - adjusts based on complexity
   */
  private getAdaptiveReasoningPrompt(query: string, context?: string): string {
    const complexity = this.assessComplexity(query);
    
    if (complexity < 0.3) {
      return this.getFastReasoningPrompt(query, context);
    } else if (complexity > 0.7) {
      return this.getDeepReasoningPrompt(query, context);
    }

    return `Consider this question: ${query}
${context ? `Context: ${context}` : ''}

Think through the key aspects:
- What are the main components?
- What evidence supports your answer?
- What are potential alternatives?

Provide a balanced response with clear reasoning.`;
  }

  /**
   * Assess query complexity
   */
  private assessComplexity(query: string): number {
    const factors = {
      length: Math.min(query.length / 500, 1) * 0.2,
      keywords: this.countComplexKeywords(query) * 0.3,
      structure: this.analyzeStructure(query) * 0.3,
      domain: this.assessDomain(query) * 0.2,
    };

    return Object.values(factors).reduce((a, b) => a + b, 0);
  }

  private countComplexKeywords(query: string): number {
    const complexKeywords = [
      'analyze', 'compare', 'evaluate', 'explain why', 'how does',
      'what if', 'relationship', 'impact', 'implications', 'trade-offs',
      'optimize', 'strategy', 'architecture', 'design', 'implement'
    ];

    const count = complexKeywords.filter(keyword => 
      query.toLowerCase().includes(keyword)
    ).length;

    return Math.min(count / 5, 1);
  }

  private analyzeStructure(query: string): number {
    const hasMultipleParts = query.includes('and') || query.includes('or');
    const hasComparison = query.includes('vs') || query.includes('versus') || query.includes('compare');
    const hasConditions = query.includes('if') || query.includes('when');
    
    const score = [hasMultipleParts, hasComparison, hasConditions]
      .filter(Boolean).length / 3;
    
    return score;
  }

  private assessDomain(query: string): number {
    const technicalDomains = [
      'algorithm', 'architecture', 'database', 'security', 'performance',
      'scalability', 'blockchain', 'cryptography', 'machine learning'
    ];

    const matches = technicalDomains.filter(domain => 
      query.toLowerCase().includes(domain)
    ).length;

    return Math.min(matches / 3, 1);
  }

  /**
   * Parse reasoning from AI response
   */
  parseReasoningSteps(response: string): ReasoningChain {
    const steps: ReasoningStep[] = [];
    
    // Simple parsing - in production, use more sophisticated parsing
    const lines = response.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      if (line.match(/^\d+\.|^-|^•/)) {
        steps.push({
          thought: line.replace(/^\d+\.|^-|^•/, '').trim(),
          confidence: 0.8, // Default confidence
          nextStepNeeded: steps.length < this.config.maxSteps,
        });
      }
    }

    return {
      steps,
      conclusion: steps[steps.length - 1]?.thought,
      totalConfidence: steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length,
    };
  }
}

// =============================================================================
// Caching for Performance
// =============================================================================

interface ReasoningCache {
  query: string;
  response: string;
  reasoning: ReasoningChain;
  timestamp: number;
}

class ReasoningCacheManager {
  private cache = new Map<string, ReasoningCache>();
  private maxCacheSize = 100;
  private cacheDuration = 3600000; // 1 hour

  getCached(query: string): ReasoningCache | null {
    const cached = this.cache.get(this.hashQuery(query));
    
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      logger.debug('Reasoning cache hit', { query });
      return cached;
    }
    
    return null;
  }

  setCached(query: string, response: string, reasoning: ReasoningChain): void {
    const key = this.hashQuery(query);
    
    // Implement LRU cache
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      query,
      response,
      reasoning,
      timestamp: Date.now(),
    });
  }

  private hashQuery(query: string): string {
    // Simple hash for demo - use crypto.subtle in production
    return query.toLowerCase().trim().substring(0, 100);
  }
}

// =============================================================================
// Exports
// =============================================================================

export const reasoningSystem = new EnhancedReasoningSystem();
export const reasoningCache = new ReasoningCacheManager();

export default {
  reasoningSystem,
  reasoningCache,
  EnhancedReasoningSystem,
  ReasoningCacheManager,
};
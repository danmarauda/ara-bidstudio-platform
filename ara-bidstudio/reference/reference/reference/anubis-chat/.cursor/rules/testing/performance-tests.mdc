---
category: testing
subcategory: performance-tests
tags: [performance, load-testing, benchmarks, optimization]
cursor:
  context_window: 16384
  temperature: 0.3
  max_tokens: 8192
  model_preference: ["auto"]
relations:
  imports: ["./e2e-tests.mdc"]
  exports: ["performance-patterns", "load-testing-strategies"]
  references: ["./integration-tests.mdc", "../ai-rag/streaming.mdc"]
---

# Performance Testing & Load Testing (2025)

## Performance Testing Framework

### Performance Testing Setup
```typescript
// src/test/performance/setup.ts
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { chromium, Browser, Page } from '@playwright/test';

export interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  totalBlockingTime: number;
  memoryUsage: number;
  networkRequests: number;
  bundleSize: number;
}

export class PerformanceTestRunner {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async setup() {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    this.page = await this.browser.newPage();
    
    // Enable performance monitoring
    await this.page.addInitScript(() => {
      (window as any).performanceMetrics = {
        navigationStart: performance.now(),
        measurements: []
      };
    });
  }

  async teardown() {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
  }

  async measurePageLoad(url: string): Promise<PerformanceMetrics> {
    if (!this.page) throw new Error('Page not initialized');

    const startTime = Date.now();
    
    // Navigate and wait for load
    await this.page.goto(url, { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;

    // Collect Core Web Vitals
    const metrics = await this.page.evaluate(() => {
      return new Promise<PerformanceMetrics>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          let fcp = 0, lcp = 0, cls = 0, fid = 0, tbt = 0;
          
          entries.forEach(entry => {
            switch (entry.entryType) {
              case 'paint':
                if (entry.name === 'first-contentful-paint') {
                  fcp = entry.startTime;
                }
                break;
              case 'largest-contentful-paint':
                lcp = entry.startTime;
                break;
              case 'layout-shift':
                if (!(entry as any).hadRecentInput) {
                  cls += (entry as any).value;
                }
                break;
            }
          });

          resolve({
            loadTime: performance.now(),
            firstContentfulPaint: fcp,
            largestContentfulPaint: lcp,
            cumulativeLayoutShift: cls,
            firstInputDelay: fid,
            totalBlockingTime: tbt,
            memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
            networkRequests: performance.getEntriesByType('resource').length,
            bundleSize: 0
          } as PerformanceMetrics);
        });

        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
        
        // Fallback timeout
        setTimeout(() => {
          resolve({
            loadTime: performance.now(),
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            cumulativeLayoutShift: 0,
            firstInputDelay: 0,
            totalBlockingTime: 0,
            memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
            networkRequests: performance.getEntriesByType('resource').length,
            bundleSize: 0
          } as PerformanceMetrics);
        }, 5000);
      });
    });

    return {
      ...metrics,
      loadTime
    };
  }

  async measureAPIResponse(endpoint: string, payload?: any): Promise<{
    responseTime: number;
    statusCode: number;
    responseSize: number;
  }> {
    if (!this.page) throw new Error('Page not initialized');

    const startTime = performance.now();
    
    const response = await this.page.request[payload ? 'post' : 'get'](endpoint, {
      data: payload
    });
    
    const endTime = performance.now();
    const responseBody = await response.text();

    return {
      responseTime: endTime - startTime,
      statusCode: response.status(),
      responseSize: responseBody.length
    };
  }

  async measureMemoryUsage(): Promise<{
    usedHeapSize: number;
    totalHeapSize: number;
    heapSizeLimit: number;
  }> {
    if (!this.page) throw new Error('Page not initialized');

    return await this.page.evaluate(() => {
      const memory = (performance as any).memory;
      return {
        usedHeapSize: memory?.usedJSHeapSize || 0,
        totalHeapSize: memory?.totalJSHeapSize || 0,
        heapSizeLimit: memory?.jsHeapSizeLimit || 0
      };
    });
  }
}
```

### Core Web Vitals Testing
```typescript
// src/test/performance/core-web-vitals.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PerformanceTestRunner } from './setup';

describe('Core Web Vitals Performance Tests', () => {
  let runner: PerformanceTestRunner;

  beforeAll(async () => {
    runner = new PerformanceTestRunner();
    await runner.setup();
  });

  afterAll(async () => {
    await runner.teardown();
  });

  describe('Page Load Performance', () => {
    it('should meet Core Web Vitals thresholds for home page', async () => {
      const metrics = await runner.measurePageLoad('http://localhost:3000');

      // Core Web Vitals thresholds
      expect(metrics.loadTime).toBeLessThan(3000); // 3 seconds total load
      expect(metrics.firstContentfulPaint).toBeLessThan(1800); // 1.8s FCP
      expect(metrics.largestContentfulPaint).toBeLessThan(2500); // 2.5s LCP
      expect(metrics.cumulativeLayoutShift).toBeLessThan(0.1); // 0.1 CLS
      expect(metrics.totalBlockingTime).toBeLessThan(300); // 300ms TBT

      console.log('Home Page Metrics:', {
        'Load Time': `${metrics.loadTime}ms`,
        'First Contentful Paint': `${metrics.firstContentfulPaint}ms`,
        'Largest Contentful Paint': `${metrics.largestContentfulPaint}ms`,
        'Cumulative Layout Shift': metrics.cumulativeLayoutShift,
        'Total Blocking Time': `${metrics.totalBlockingTime}ms`,
        'Network Requests': metrics.networkRequests
      });
    }, 30000);

    it('should meet performance thresholds for chat page', async () => {
      const metrics = await runner.measurePageLoad('http://localhost:3000/chat');

      // Chat-specific performance requirements
      expect(metrics.loadTime).toBeLessThan(4000); // 4 seconds for feature-rich page
      expect(metrics.firstContentfulPaint).toBeLessThan(2000); // 2s FCP
      expect(metrics.largestContentfulPaint).toBeLessThan(3000); // 3s LCP
      expect(metrics.memoryUsage).toBeLessThan(100 * 1024 * 1024); // 100MB

      console.log('Chat Page Metrics:', {
        'Load Time': `${metrics.loadTime}ms`,
        'Memory Usage': `${Math.round(metrics.memoryUsage / 1024 / 1024)}MB`,
        'Network Requests': metrics.networkRequests
      });
    }, 30000);

    it('should perform well on mobile viewport', async () => {
      // Set mobile viewport
      await runner.page?.setViewportSize({ width: 375, height: 667 });
      
      const metrics = await runner.measurePageLoad('http://localhost:3000');

      // Mobile-specific thresholds (slightly more lenient)
      expect(metrics.loadTime).toBeLessThan(4000); // 4 seconds on mobile
      expect(metrics.firstContentfulPaint).toBeLessThan(2500); // 2.5s FCP
      expect(metrics.largestContentfulPaint).toBeLessThan(4000); // 4s LCP
      
      console.log('Mobile Metrics:', {
        'Load Time': `${metrics.loadTime}ms`,
        'First Contentful Paint': `${metrics.firstContentfulPaint}ms`
      });
    }, 30000);
  });

  describe('Progressive Loading', () => {
    it('should show content progressively', async () => {
      const measurements: number[] = [];
      
      // Take screenshots at different intervals to verify progressive loading
      await runner.page?.goto('http://localhost:3000');
      
      // Measure content visibility at different stages
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const visibleContent = await runner.page?.evaluate(() => {
          const elements = document.querySelectorAll('*');
          let visibleElements = 0;
          
          elements.forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
              visibleElements++;
            }
          });
          
          return visibleElements;
        });
        
        measurements.push(visibleContent || 0);
      }

      // Should show progressive content loading
      expect(measurements[0]).toBeGreaterThan(0); // Initial content
      expect(measurements[4]).toBeGreaterThan(measurements[0]); // More content over time
    });
  });
});
```

## API Performance Testing

### Response Time Testing
```typescript
// src/test/performance/api-performance.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PerformanceTestRunner } from './setup';

describe('API Performance Tests', () => {
  let runner: PerformanceTestRunner;

  beforeAll(async () => {
    runner = new PerformanceTestRunner();
    await runner.setup();
  });

  afterAll(async () => {
    await runner.teardown();
  });

  describe('Chat API Performance', () => {
    it('should respond to chat requests within performance thresholds', async () => {
      const testCases = [
        {
          message: 'What is Solana?',
          expectedMaxTime: 5000, // 5 seconds
          description: 'Simple question'
        },
        {
          message: 'Explain how to create a complex Solana program with multiple instructions and accounts',
          expectedMaxTime: 8000, // 8 seconds for complex query
          description: 'Complex question'
        },
        {
          message: 'Hi',
          expectedMaxTime: 3000, // 3 seconds for simple greeting
          description: 'Simple greeting'
        }
      ];

      for (const testCase of testCases) {
        const result = await runner.measureAPIResponse('http://localhost:3000/api/chat', {
          message: testCase.message,
          sessionId: 'test-session'
        });

        expect(result.responseTime).toBeLessThan(testCase.expectedMaxTime);
        expect(result.statusCode).toBe(200);
        expect(result.responseSize).toBeGreaterThan(10); // Should have meaningful response

        console.log(`${testCase.description}:`, {
          'Response Time': `${Math.round(result.responseTime)}ms`,
          'Response Size': `${result.responseSize} bytes`,
          'Status': result.statusCode
        });
      }
    }, 60000);

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const startTime = performance.now();

      const promises = Array(concurrentRequests).fill(null).map((_, i) =>
        runner.measureAPIResponse('http://localhost:3000/api/chat', {
          message: `Concurrent test message ${i + 1}`,
          sessionId: `session-${i + 1}`
        })
      );

      const results = await Promise.all(promises);
      const totalTime = performance.now() - startTime;

      // All requests should succeed
      expect(results.every(r => r.statusCode === 200)).toBe(true);

      // Average response time should be reasonable
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      expect(avgResponseTime).toBeLessThan(10000); // 10s average

      // Total time should be much less than sequential execution
      const sequentialEstimate = avgResponseTime * concurrentRequests;
      expect(totalTime).toBeLessThan(sequentialEstimate * 0.7); // At least 30% faster

      console.log('Concurrent Request Results:', {
        'Concurrent Requests': concurrentRequests,
        'Total Time': `${Math.round(totalTime)}ms`,
        'Average Response Time': `${Math.round(avgResponseTime)}ms`,
        'Sequential Estimate': `${Math.round(sequentialEstimate)}ms`,
        'Efficiency Gain': `${Math.round((1 - totalTime / sequentialEstimate) * 100)}%`
      });
    }, 120000);

    it('should maintain performance under sustained load', async () => {
      const duration = 30000; // 30 seconds
      const requestInterval = 1000; // 1 request per second
      const responseTimes: number[] = [];
      const errors: number[] = [];

      const startTime = Date.now();
      let requestCount = 0;

      while (Date.now() - startTime < duration) {
        try {
          const result = await runner.measureAPIResponse('http://localhost:3000/api/chat', {
            message: `Load test message ${++requestCount}`,
            sessionId: 'load-test-session'
          });

          responseTimes.push(result.responseTime);

          if (result.statusCode !== 200) {
            errors.push(requestCount);
          }
        } catch (error) {
          errors.push(requestCount);
        }

        await new Promise(resolve => setTimeout(resolve, requestInterval));
      }

      // Performance should not degrade significantly
      const firstThirdAvg = responseTimes.slice(0, Math.floor(responseTimes.length / 3))
        .reduce((sum, time) => sum + time, 0) / Math.floor(responseTimes.length / 3);
      
      const lastThirdAvg = responseTimes.slice(-Math.floor(responseTimes.length / 3))
        .reduce((sum, time) => sum + time, 0) / Math.floor(responseTimes.length / 3);

      // Last third should not be more than 50% slower than first third
      expect(lastThirdAvg).toBeLessThan(firstThirdAvg * 1.5);

      // Error rate should be low
      const errorRate = errors.length / requestCount;
      expect(errorRate).toBeLessThan(0.05); // Less than 5% error rate

      console.log('Sustained Load Results:', {
        'Total Requests': requestCount,
        'Error Rate': `${Math.round(errorRate * 100)}%`,
        'First Third Avg': `${Math.round(firstThirdAvg)}ms`,
        'Last Third Avg': `${Math.round(lastThirdAvg)}ms`,
        'Performance Degradation': `${Math.round((lastThirdAvg / firstThirdAvg - 1) * 100)}%`
      });
    }, 60000);
  });

  describe('Vector Search Performance', () => {
    it('should perform vector searches within thresholds', async () => {
      const searchQueries = [
        'Solana development',
        'smart contracts',
        'DeFi protocols',
        'NFT marketplace'
      ];

      for (const query of searchQueries) {
        const result = await runner.measureAPIResponse('http://localhost:3000/api/search', {
          query,
          limit: 10
        });

        expect(result.responseTime).toBeLessThan(1000); // 1 second for search
        expect(result.statusCode).toBe(200);

        console.log(`Search "${query}":`, {
          'Response Time': `${Math.round(result.responseTime)}ms`
        });
      }
    });

    it('should handle large result sets efficiently', async () => {
      const limits = [10, 50, 100];

      for (const limit of limits) {
        const result = await runner.measureAPIResponse('http://localhost:3000/api/search', {
          query: 'blockchain development',
          limit
        });

        // Response time should scale reasonably with result set size
        const expectedMaxTime = 500 + (limit * 10); // Base time + scaling factor
        expect(result.responseTime).toBeLessThan(expectedMaxTime);

        console.log(`Search limit ${limit}:`, {
          'Response Time': `${Math.round(result.responseTime)}ms`,
          'Expected Max': `${expectedMaxTime}ms`
        });
      }
    });
  });
});
```

## Memory and Resource Testing

### Memory Leak Detection
```typescript
// src/test/performance/memory-testing.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PerformanceTestRunner } from './setup';

describe('Memory and Resource Tests', () => {
  let runner: PerformanceTestRunner;

  beforeAll(async () => {
    runner = new PerformanceTestRunner();
    await runner.setup();
  });

  afterAll(async () => {
    await runner.teardown();
  });

  describe('Memory Usage', () => {
    it('should maintain stable memory usage during normal operation', async () => {
      await runner.page?.goto('http://localhost:3000');
      
      const initialMemory = await runner.measureMemoryUsage();
      const memoryMeasurements: number[] = [initialMemory.usedHeapSize];

      // Simulate normal user interactions
      for (let i = 0; i < 10; i++) {
        // Send chat messages
        await runner.page?.evaluate(() => {
          const input = document.querySelector('[data-testid="message-input"]') as HTMLInputElement;
          const button = document.querySelector('[data-testid="send-button"]') as HTMLButtonElement;
          
          if (input && button) {
            input.value = `Memory test message ${i + 1}`;
            button.click();
          }
        });

        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for response

        const currentMemory = await runner.measureMemoryUsage();
        memoryMeasurements.push(currentMemory.usedHeapSize);
      }

      // Memory should not grow excessively
      const finalMemory = memoryMeasurements[memoryMeasurements.length - 1];
      const memoryIncrease = finalMemory - initialMemory.usedHeapSize;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.usedHeapSize) * 100;

      expect(memoryIncreasePercent).toBeLessThan(200); // Less than 200% increase

      // Should not have extreme spikes
      const maxMemory = Math.max(...memoryMeasurements);
      const avgMemory = memoryMeasurements.reduce((sum, mem) => sum + mem, 0) / memoryMeasurements.length;
      
      expect(maxMemory).toBeLessThan(avgMemory * 2); // Max should not be 2x average

      console.log('Memory Usage Analysis:', {
        'Initial Memory': `${Math.round(initialMemory.usedHeapSize / 1024 / 1024)}MB`,
        'Final Memory': `${Math.round(finalMemory / 1024 / 1024)}MB`,
        'Memory Increase': `${Math.round(memoryIncreasePercent)}%`,
        'Peak Memory': `${Math.round(maxMemory / 1024 / 1024)}MB`
      });
    }, 60000);

    it('should clean up memory after conversation deletion', async () => {
      await runner.page?.goto('http://localhost:3000');
      
      const initialMemory = await runner.measureMemoryUsage();

      // Create multiple conversations
      for (let i = 0; i < 5; i++) {
        await runner.page?.click('[data-testid="new-chat-button"]');
        
        await runner.page?.fill('[data-testid="message-input"]', `Conversation ${i + 1} message`);
        await runner.page?.click('[data-testid="send-button"]');
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const afterCreationMemory = await runner.measureMemoryUsage();

      // Delete all conversations
      for (let i = 0; i < 5; i++) {
        await runner.page?.click('[data-testid="conversation-item"]:first-child [data-testid="delete-button"]');
        await runner.page?.click('[data-testid="confirm-delete"]');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Force garbage collection if available
      await runner.page?.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const afterDeletionMemory = await runner.measureMemoryUsage();

      // Memory should decrease after deletion
      const memoryReduction = afterCreationMemory.usedHeapSize - afterDeletionMemory.usedHeapSize;
      const reductionPercent = (memoryReduction / afterCreationMemory.usedHeapSize) * 100;

      expect(reductionPercent).toBeGreaterThan(10); // Should reduce by at least 10%

      console.log('Memory Cleanup Analysis:', {
        'Initial': `${Math.round(initialMemory.usedHeapSize / 1024 / 1024)}MB`,
        'After Creation': `${Math.round(afterCreationMemory.usedHeapSize / 1024 / 1024)}MB`,
        'After Deletion': `${Math.round(afterDeletionMemory.usedHeapSize / 1024 / 1024)}MB`,
        'Memory Reduction': `${Math.round(reductionPercent)}%`
      });
    }, 60000);
  });

  describe('Resource Usage', () => {
    it('should limit network requests during normal operation', async () => {
      await runner.page?.goto('http://localhost:3000');
      
      // Track network requests
      const networkRequests: string[] = [];
      runner.page?.on('request', request => {
        networkRequests.push(request.url());
      });

      // Normal user interaction
      await runner.page?.fill('[data-testid="message-input"]', 'Test message');
      await runner.page?.click('[data-testid="send-button"]');
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for response

      // Filter relevant requests (exclude static assets)
      const apiRequests = networkRequests.filter(url => 
        url.includes('/api/') || url.includes('/ws')
      );

      // Should make reasonable number of API requests
      expect(apiRequests.length).toBeLessThan(5); // Not too many requests
      expect(apiRequests.length).toBeGreaterThan(0); // But should make some requests

      console.log('Network Analysis:', {
        'Total Requests': networkRequests.length,
        'API Requests': apiRequests.length,
        'API Endpoints': [...new Set(apiRequests)]
      });
    }, 30000);

    it('should handle DOM node management efficiently', async () => {
      await runner.page?.goto('http://localhost:3000');
      
      const initialNodeCount = await runner.page?.evaluate(() => 
        document.querySelectorAll('*').length
      );

      // Add many messages
      for (let i = 0; i < 50; i++) {
        await runner.page?.evaluate((index) => {
          // Simulate adding message to DOM
          const container = document.querySelector('[data-testid="messages-container"]');
          if (container) {
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            messageElement.textContent = `Message ${index}`;
            container.appendChild(messageElement);
          }
        }, i);
      }

      const afterAdditionNodeCount = await runner.page?.evaluate(() => 
        document.querySelectorAll('*').length
      );

      // Remove messages (simulating cleanup)
      await runner.page?.evaluate(() => {
        const messages = document.querySelectorAll('.message');
        messages.forEach((msg, index) => {
          if (index < 40) { // Remove 40 out of 50
            msg.remove();
          }
        });
      });

      const afterRemovalNodeCount = await runner.page?.evaluate(() => 
        document.querySelectorAll('*').length
      );

      // DOM should be managed efficiently
      const nodesAdded = (afterAdditionNodeCount || 0) - (initialNodeCount || 0);
      const nodesRemoved = (afterAdditionNodeCount || 0) - (afterRemovalNodeCount || 0);

      expect(nodesAdded).toBeGreaterThan(40); // Should add nodes
      expect(nodesRemoved).toBeGreaterThan(35); // Should remove most nodes

      console.log('DOM Management Analysis:', {
        'Initial Nodes': initialNodeCount,
        'After Addition': afterAdditionNodeCount,
        'After Removal': afterRemovalNodeCount,
        'Nodes Added': nodesAdded,
        'Nodes Removed': nodesRemoved
      });
    }, 30000);
  });
});
```

## Streaming Performance Testing

### Real-time Response Testing
```typescript
// src/test/performance/streaming-performance.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PerformanceTestRunner } from './setup';

describe('Streaming Performance Tests', () => {
  let runner: PerformanceTestRunner;

  beforeAll(async () => {
    runner = new PerformanceTestRunner();
    await runner.setup();
  });

  afterAll(async () => {
    await runner.teardown();
  });

  describe('Streaming Response Performance', () => {
    it('should deliver first chunk within acceptable time', async () => {
      await runner.page?.goto('http://localhost:3000');

      const timings = await runner.page?.evaluate(async () => {
        const startTime = performance.now();
        let firstChunkTime = 0;
        let totalResponseTime = 0;
        let chunkCount = 0;

        // Mock fetch request to streaming endpoint
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Explain how Solana consensus works in detail',
            sessionId: 'test-streaming'
          })
        });

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');

        const decoder = new TextDecoder();
        let chunks: string[] = [];

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;

            chunkCount++;
            const chunk = decoder.decode(value, { stream: true });
            chunks.push(chunk);

            if (firstChunkTime === 0) {
              firstChunkTime = performance.now() - startTime;
            }
          }
        } finally {
          reader.releaseLock();
          totalResponseTime = performance.now() - startTime;
        }

        return {
          firstChunkTime,
          totalResponseTime,
          chunkCount,
          averageChunkTime: totalResponseTime / chunkCount
        };
      });

      if (timings) {
        // First chunk should arrive quickly
        expect(timings.firstChunkTime).toBeLessThan(2000); // 2 seconds for first chunk
        
        // Should have reasonable number of chunks
        expect(timings.chunkCount).toBeGreaterThan(5);
        
        // Average chunk delivery should be fast
        expect(timings.averageChunkTime).toBeLessThan(500); // 500ms average per chunk

        console.log('Streaming Performance:', {
          'Time to First Chunk': `${Math.round(timings.firstChunkTime)}ms`,
          'Total Response Time': `${Math.round(timings.totalResponseTime)}ms`,
          'Total Chunks': timings.chunkCount,
          'Average Chunk Time': `${Math.round(timings.averageChunkTime)}ms`
        });
      }
    }, 30000);

    it('should handle streaming interruption gracefully', async () => {
      await runner.page?.goto('http://localhost:3000');

      const result = await runner.page?.evaluate(async () => {
        const startTime = performance.now();
        let chunksReceived = 0;
        let interruptionTime = 0;

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Write a very long explanation about blockchain technology',
            sessionId: 'test-interruption'
          })
        });

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');

        const decoder = new TextDecoder();

        try {
          while (chunksReceived < 5) { // Read first 5 chunks
            const { done, value } = await reader.read();
            if (done) break;
            
            chunksReceived++;
          }

          // Interrupt the stream
          interruptionTime = performance.now() - startTime;
          await reader.cancel('User cancelled');
          
          // Try to read more (should be done)
          const { done } = await reader.read();
          
          return {
            chunksReceived,
            interruptionTime,
            gracefulTermination: done
          };
        } catch (error) {
          return {
            chunksReceived,
            interruptionTime: performance.now() - startTime,
            gracefulTermination: false,
            error: error.message
          };
        }
      });

      if (result) {
        expect(result.chunksReceived).toBeGreaterThanOrEqual(5);
        expect(result.interruptionTime).toBeLessThan(10000); // Should interrupt within 10s
        expect(result.gracefulTermination).toBe(true);

        console.log('Stream Interruption:', {
          'Chunks Received': result.chunksReceived,
          'Interruption Time': `${Math.round(result.interruptionTime)}ms`,
          'Graceful Termination': result.gracefulTermination
        });
      }
    }, 30000);

    it('should maintain consistent streaming rate', async () => {
      await runner.page?.goto('http://localhost:3000');

      const streamingMetrics = await runner.page?.evaluate(async () => {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Provide a comprehensive guide to Solana development',
            sessionId: 'rate-consistency-test'
          })
        });

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');

        const chunkTimes: number[] = [];
        const chunkSizes: number[] = [];
        let lastTime = performance.now();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const currentTime = performance.now();
            const chunkTime = currentTime - lastTime;
            
            chunkTimes.push(chunkTime);
            chunkSizes.push(value.length);
            lastTime = currentTime;
          }
        } finally {
          reader.releaseLock();
        }

        // Calculate statistics
        const avgChunkTime = chunkTimes.reduce((a, b) => a + b, 0) / chunkTimes.length;
        const avgChunkSize = chunkSizes.reduce((a, b) => a + b, 0) / chunkSizes.length;
        
        // Calculate variance
        const timeVariance = chunkTimes.reduce((sum, time) => 
          sum + Math.pow(time - avgChunkTime, 2), 0) / chunkTimes.length;
        const timeStdDev = Math.sqrt(timeVariance);

        return {
          avgChunkTime,
          avgChunkSize,
          timeStdDev,
          totalChunks: chunkTimes.length,
          minChunkTime: Math.min(...chunkTimes),
          maxChunkTime: Math.max(...chunkTimes)
        };
      });

      if (streamingMetrics) {
        // Reasonable average chunk time
        expect(streamingMetrics.avgChunkTime).toBeLessThan(1000);
        expect(streamingMetrics.avgChunkTime).toBeGreaterThan(50);
        
        // Consistent timing (low variance)
        expect(streamingMetrics.timeStdDev).toBeLessThan(streamingMetrics.avgChunkTime);
        
        // No excessive delays
        expect(streamingMetrics.maxChunkTime).toBeLessThan(streamingMetrics.avgChunkTime * 3);

        console.log('Streaming Rate Consistency:', {
          'Average Chunk Time': `${Math.round(streamingMetrics.avgChunkTime)}ms`,
          'Time Std Deviation': `${Math.round(streamingMetrics.timeStdDev)}ms`,
          'Min Chunk Time': `${Math.round(streamingMetrics.minChunkTime)}ms`,
          'Max Chunk Time': `${Math.round(streamingMetrics.maxChunkTime)}ms`,
          'Total Chunks': streamingMetrics.totalChunks,
          'Average Chunk Size': `${Math.round(streamingMetrics.avgChunkSize)} bytes`
        });
      }
    }, 45000);
  });
});
```

## Performance Benchmarking

### Baseline Performance Benchmarks
```typescript
// src/test/performance/benchmarks.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PerformanceTestRunner } from './setup';

describe('Performance Benchmarks', () => {
  let runner: PerformanceTestRunner;

  beforeAll(async () => {
    runner = new PerformanceTestRunner();
    await runner.setup();
  });

  afterAll(async () => {
    await runner.teardown();
  });

  describe('Baseline Benchmarks', () => {
    interface BenchmarkResults {
      pageLoadTime: number;
      firstContentfulPaint: number;
      interactionDelay: number;
      memoryUsage: number;
      apiResponseTime: number;
    }

    it('should establish and meet performance baselines', async () => {
      // Define performance baselines (adjust based on your requirements)
      const baselines = {
        pageLoadTime: 3000, // 3 seconds
        firstContentfulPaint: 1800, // 1.8 seconds
        interactionDelay: 100, // 100ms
        memoryUsage: 50 * 1024 * 1024, // 50MB
        apiResponseTime: 5000 // 5 seconds
      };

      // Measure actual performance
      const pageMetrics = await runner.measurePageLoad('http://localhost:3000');
      const apiMetrics = await runner.measureAPIResponse('http://localhost:3000/api/chat', {
        message: 'Benchmark test message'
      });
      const memoryMetrics = await runner.measureMemoryUsage();

      // Measure interaction delay
      const interactionDelay = await runner.page?.evaluate(async () => {
        const startTime = performance.now();
        
        // Simulate button click
        const button = document.querySelector('[data-testid="send-button"]') as HTMLButtonElement;
        if (button) {
          button.click();
          // Wait for visual feedback
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        return performance.now() - startTime;
      }) || 0;

      const results: BenchmarkResults = {
        pageLoadTime: pageMetrics.loadTime,
        firstContentfulPaint: pageMetrics.firstContentfulPaint,
        interactionDelay,
        memoryUsage: memoryMetrics.usedHeapSize,
        apiResponseTime: apiMetrics.responseTime
      };

      // Verify against baselines
      expect(results.pageLoadTime).toBeLessThan(baselines.pageLoadTime);
      expect(results.firstContentfulPaint).toBeLessThan(baselines.firstContentfulPaint);
      expect(results.interactionDelay).toBeLessThan(baselines.interactionDelay);
      expect(results.memoryUsage).toBeLessThan(baselines.memoryUsage);
      expect(results.apiResponseTime).toBeLessThan(baselines.apiResponseTime);

      // Log results for tracking
      console.log('Performance Benchmark Results:');
      console.table({
        'Page Load Time': {
          baseline: `${baselines.pageLoadTime}ms`,
          actual: `${Math.round(results.pageLoadTime)}ms`,
          status: results.pageLoadTime < baselines.pageLoadTime ? '✅ PASS' : '❌ FAIL'
        },
        'First Contentful Paint': {
          baseline: `${baselines.firstContentfulPaint}ms`,
          actual: `${Math.round(results.firstContentfulPaint)}ms`,
          status: results.firstContentfulPaint < baselines.firstContentfulPaint ? '✅ PASS' : '❌ FAIL'
        },
        'Interaction Delay': {
          baseline: `${baselines.interactionDelay}ms`,
          actual: `${Math.round(results.interactionDelay)}ms`,
          status: results.interactionDelay < baselines.interactionDelay ? '✅ PASS' : '❌ FAIL'
        },
        'Memory Usage': {
          baseline: `${Math.round(baselines.memoryUsage / 1024 / 1024)}MB`,
          actual: `${Math.round(results.memoryUsage / 1024 / 1024)}MB`,
          status: results.memoryUsage < baselines.memoryUsage ? '✅ PASS' : '❌ FAIL'
        },
        'API Response Time': {
          baseline: `${baselines.apiResponseTime}ms`,
          actual: `${Math.round(results.apiResponseTime)}ms`,
          status: results.apiResponseTime < baselines.apiResponseTime ? '✅ PASS' : '❌ FAIL'
        }
      });
    }, 60000);
  });

  describe('Performance Regression Testing', () => {
    it('should detect performance regressions', async () => {
      // This would typically compare against stored baseline data
      // For demo purposes, we'll simulate checking against previous runs
      
      const currentMetrics = await runner.measurePageLoad('http://localhost:3000');
      
      // Simulate previous baseline (in real implementation, load from file/database)
      const previousBaseline = {
        loadTime: 2800,
        firstContentfulPaint: 1600,
        largestContentfulPaint: 2300
      };

      // Check for regressions (more than 20% slower)
      const regressionThreshold = 1.2;
      
      const loadTimeRegression = currentMetrics.loadTime > (previousBaseline.loadTime * regressionThreshold);
      const fcpRegression = currentMetrics.firstContentfulPaint > (previousBaseline.firstContentfulPaint * regressionThreshold);
      const lcpRegression = currentMetrics.largestContentfulPaint > (previousBaseline.largestContentfulPaint * regressionThreshold);

      // Should not have significant regressions
      expect(loadTimeRegression).toBe(false);
      expect(fcpRegression).toBe(false);
      expect(lcpRegression).toBe(false);

      if (loadTimeRegression || fcpRegression || lcpRegression) {
        console.warn('Performance Regression Detected!', {
          'Load Time': {
            previous: `${previousBaseline.loadTime}ms`,
            current: `${Math.round(currentMetrics.loadTime)}ms`,
            regression: loadTimeRegression
          },
          'FCP': {
            previous: `${previousBaseline.firstContentfulPaint}ms`,
            current: `${Math.round(currentMetrics.firstContentfulPaint)}ms`,
            regression: fcpRegression
          },
          'LCP': {
            previous: `${previousBaseline.largestContentfulPaint}ms`,
            current: `${Math.round(currentMetrics.largestContentfulPaint)}ms`,
            regression: lcpRegression
          }
        });
      }
    }, 30000);
  });
});
```

## Performance Testing Best Practices

### Testing Strategy
1. **Establish Baselines**: Set realistic performance baselines based on user needs
2. **Regular Monitoring**: Run performance tests in CI/CD pipeline
3. **Real-World Conditions**: Test under realistic network and device conditions
4. **Progressive Enhancement**: Test how performance degrades with increased load

### Metrics Focus
1. **User-Centric Metrics**: Focus on metrics that impact user experience
2. **Business Impact**: Correlate performance metrics with business outcomes
3. **Trend Analysis**: Track performance trends over time
4. **Threshold Management**: Set appropriate thresholds for alerts and failures

### Optimization Guidelines
1. **Measure First**: Always measure before optimizing
2. **Prioritize Impact**: Focus on optimizations with highest user impact
3. **Validate Improvements**: Confirm optimizations actually improve performance
4. **Monitor Regressions**: Continuously monitor for performance regressions
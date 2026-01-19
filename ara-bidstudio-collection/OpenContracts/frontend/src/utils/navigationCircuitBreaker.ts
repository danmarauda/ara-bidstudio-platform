/**
 * Navigation Circuit Breaker
 *
 * Detects and prevents infinite navigation loops caused by racing state updates.
 * Tracks navigation history with timestamps to identify rapid back-and-forth patterns.
 */

import { routingLogger } from "./routingLogger";

interface NavigationEvent {
  url: string;
  timestamp: number;
  source: string; // Which component triggered it
}

class NavigationCircuitBreaker {
  private history: NavigationEvent[] = [];
  private readonly WINDOW_MS = 3000; // Look at last 3 seconds
  private readonly MAX_NAVIGATIONS = 5; // Max navigations in window
  private readonly LOOP_THRESHOLD = 3; // How many times same URL in window = loop
  private tripped = false;

  /**
   * Record a navigation event
   * Returns true if circuit breaker allows navigation, false if tripped
   */
  public recordNavigation(url: string, source: string): boolean {
    const now = Date.now();

    // Clean old events outside window
    this.history = this.history.filter(
      (event) => now - event.timestamp < this.WINDOW_MS
    );

    // Check if circuit is already tripped
    if (this.tripped) {
      console.error(
        `🚨 [CircuitBreaker] BLOCKED navigation from ${source} - circuit is tripped!`,
        { url, historyCount: this.history.length }
      );
      return false;
    }

    // Record new event
    this.history.push({ url, timestamp: now, source });

    routingLogger.debug(
      `📍 [CircuitBreaker] Recorded navigation #${this.history.length}:`,
      {
        url,
        source,
        timestamp: now,
        historyInWindow: this.history.length,
      }
    );

    // Check for excessive navigations
    if (this.history.length > this.MAX_NAVIGATIONS) {
      this.trip(
        `Too many navigations (${this.history.length} in ${this.WINDOW_MS}ms)`
      );
      return false;
    }

    // Check for URL ping-pong (same URL appearing multiple times)
    const urlCounts = new Map<string, number>();
    this.history.forEach((event) => {
      urlCounts.set(event.url, (urlCounts.get(event.url) || 0) + 1);
    });

    for (const [checkUrl, count] of urlCounts.entries()) {
      if (count >= this.LOOP_THRESHOLD) {
        this.trip(
          `Navigation loop detected: "${checkUrl}" appeared ${count} times`
        );
        return false;
      }
    }

    // Check for rapid back-and-forth between two URLs
    if (this.history.length >= 4) {
      const recent = this.history.slice(-4);
      if (
        recent[0].url === recent[2].url &&
        recent[1].url === recent[3].url &&
        recent[0].url !== recent[1].url
      ) {
        this.trip(
          `Ping-pong detected between "${recent[0].url}" and "${recent[1].url}"`
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Trip the circuit breaker
   */
  private trip(reason: string): void {
    this.tripped = true;
    console.error(`🚨🚨🚨 [CircuitBreaker] CIRCUIT TRIPPED! 🚨🚨🚨`);
    console.error(`Reason: ${reason}`);
    console.error(`Navigation history (last ${this.WINDOW_MS}ms):`);
    this.history.forEach((event, index) => {
      console.error(
        `  ${index + 1}. [${event.source}] ${event.url} @ ${new Date(
          event.timestamp
        ).toISOString()}`
      );
    });
    console.error(
      `Circuit will remain tripped until page reload. Manual navigation required.`
    );

    // Show user-visible error
    alert(
      `⚠️ Navigation Circuit Breaker Tripped!\n\n` +
        `Detected infinite navigation loop.\n` +
        `${reason}\n\n` +
        `Please reload the page and check console for details.`
    );
  }

  /**
   * Reset the circuit breaker (for testing/debugging)
   */
  public reset(): void {
    console.warn(`[CircuitBreaker] Manual reset triggered`);
    this.history = [];
    this.tripped = false;
  }

  /**
   * Get current status
   */
  public getStatus() {
    return {
      tripped: this.tripped,
      eventCount: this.history.length,
      events: [...this.history],
    };
  }
}

// Global singleton instance
export const navigationCircuitBreaker = new NavigationCircuitBreaker();

// Expose to window for debugging
if (typeof window !== "undefined") {
  (window as any).navigationCircuitBreaker = navigationCircuitBreaker;
}

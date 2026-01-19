/**
 * Routing Logger Utility
 *
 * Provides controlled logging for routing operations:
 * - Normal mode: Only errors and circuit breaker trips visible
 * - Debug mode: All routing logs visible
 *
 * Enable debug mode in browser console:
 *   window.DEBUG_ROUTING = true
 *
 * Disable debug mode:
 *   window.DEBUG_ROUTING = false
 */

declare global {
  interface Window {
    DEBUG_ROUTING?: boolean;
  }
}

class RoutingLogger {
  private get isDebugEnabled(): boolean {
    return typeof window !== "undefined" && window.DEBUG_ROUTING === true;
  }

  /**
   * Debug logs - only shown when DEBUG_ROUTING is enabled
   * Uses console.debug() which is hidden by default in most browsers
   */
  debug(message: string, ...args: any[]): void {
    if (this.isDebugEnabled) {
      console.debug(message, ...args);
    }
  }

  /**
   * Info logs - always shown but not as verbose
   * Used for important state transitions
   */
  info(message: string, ...args: any[]): void {
    console.log(message, ...args);
  }

  /**
   * Warning logs - always shown
   */
  warn(message: string, ...args: any[]): void {
    console.warn(message, ...args);
  }

  /**
   * Error logs - always shown
   */
  error(message: string, ...args: any[]): void {
    console.error(message, ...args);
  }

  /**
   * Enable debug mode
   */
  enableDebug(): void {
    if (typeof window !== "undefined") {
      window.DEBUG_ROUTING = true;
      console.log(
        "🐛 Routing debug mode ENABLED - all routing logs will be visible"
      );
    }
  }

  /**
   * Disable debug mode
   */
  disableDebug(): void {
    if (typeof window !== "undefined") {
      window.DEBUG_ROUTING = false;
      console.log(
        "✅ Routing debug mode DISABLED - only errors and warnings visible"
      );
    }
  }

  /**
   * Get current debug status
   */
  getStatus(): { debugEnabled: boolean } {
    return { debugEnabled: this.isDebugEnabled };
  }
}

export const routingLogger = new RoutingLogger();

// Expose to window for easy debugging
if (typeof window !== "undefined") {
  (window as any).routingLogger = routingLogger;
}

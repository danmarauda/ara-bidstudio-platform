'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { useEffect } from 'react';

interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  navigationType?: string;
}

/**
 * Web Vitals monitoring component for performance tracking
 * Implements Next.js best practices for Core Web Vitals monitoring
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Web Vital:', metric);
    }

    // Send to analytics endpoint
    const body = {
      id: metric.id,
      name: metric.name,
      value: metric.value,
      label: metric.label,
      rating: metric.rating,
    };

    // You can send metrics to your analytics service here
    // For now, we'll use console.log and prepare for Vercel Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_label: metric.id,
        non_interaction: true,
      });
    }

    // Send to custom analytics endpoint if configured
    if (process.env.NEXT_PUBLIC_ANALYTICS_URL) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }).catch((error) => {
        console.error('Failed to send analytics:', error);
      });
    }

    // Special handling for specific metrics
    switch (metric.name) {
      case 'FCP': // First Contentful Paint
        // Track initial render performance
        if (metric.value > 1800) {
          console.warn('FCP is slow:', metric.value);
        }
        break;
      case 'LCP': // Largest Contentful Paint
        // Track main content load
        if (metric.value > 2500) {
          console.warn('LCP is slow:', metric.value);
        }
        break;
      case 'CLS': // Cumulative Layout Shift
        // Track visual stability
        if (metric.value > 0.1) {
          console.warn('CLS is high:', metric.value);
        }
        break;
      case 'FID': // First Input Delay
        // Track interactivity
        if (metric.value > 100) {
          console.warn('FID is slow:', metric.value);
        }
        break;
      case 'TTFB': // Time to First Byte
        // Track server response time
        if (metric.value > 800) {
          console.warn('TTFB is slow:', metric.value);
        }
        break;
      case 'INP': // Interaction to Next Paint
        // Track responsiveness
        if (metric.value > 200) {
          console.warn('INP is slow:', metric.value);
        }
        break;
    }
  });

  // Optional: Track custom metrics
  useEffect(() => {
    // Track time to first AI response
    if (typeof window !== 'undefined') {
      const measureFirstAIResponse = () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const firstResponse = performance.mark('first-ai-response');
        
        if (navigation && firstResponse) {
          const timeToFirstResponse = firstResponse.startTime - navigation.fetchStart;
          
          // Report custom metric
          if (process.env.NODE_ENV === 'development') {
            console.log('Time to First AI Response:', timeToFirstResponse);
          }
        }
      };

      // Set up observer for first AI message
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            const target = mutation.target as HTMLElement;
            if (target.classList?.contains('message-content')) {
              measureFirstAIResponse();
              observer.disconnect();
              break;
            }
          }
        }
      });

      // Start observing when chat container is available
      const startObserving = () => {
        const chatContainer = document.querySelector('[data-chat-messages]');
        if (chatContainer) {
          observer.observe(chatContainer, { childList: true, subtree: true });
        }
      };

      // Try immediately or wait for DOM
      if (document.readyState === 'complete') {
        startObserving();
      } else {
        window.addEventListener('load', startObserving);
      }

      return () => {
        observer.disconnect();
      };
    }
  }, []);

  return null;
}

// Export utility function for manual metric reporting
export function reportCustomMetric(name: string, value: number) {
  if (process.env.NODE_ENV === 'development') {
    console.log('Custom Metric:', { name, value });
  }

  // Send to analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'custom_metric', {
      metric_name: name,
      value: Math.round(value),
      non_interaction: true,
    });
  }
}
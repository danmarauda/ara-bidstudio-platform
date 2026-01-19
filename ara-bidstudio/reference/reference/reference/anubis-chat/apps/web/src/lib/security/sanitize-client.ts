/**
 * Client-side HTML Sanitization Utilities
 * Browser-only DOMPurify wrapper for safe HTML rendering
 */

import DOMPurify, { type Config } from 'dompurify';

/**
 * Default sanitization options for code highlighting
 */
const DEFAULT_CODE_SANITIZE_OPTIONS: Config = {
  ALLOWED_TAGS: ['span', 'br'],
  ALLOWED_ATTR: ['class', 'style'],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  SANITIZE_DOM: true,
  WHOLE_DOCUMENT: false,
};

/**
 * Strict sanitization options for user content
 */
const STRICT_SANITIZE_OPTIONS: Config = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'a'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  SANITIZE_DOM: true,
  WHOLE_DOCUMENT: false,
  FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover'],
  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
};

/**
 * Sanitize HTML for syntax-highlighted code blocks
 * Allows only spans and line breaks with class/style attributes
 */
export function sanitizeCodeHTML(html: string): string {
  try {
    if (typeof window === 'undefined') {
      // Server-side fallback - just escape HTML
      return sanitizeText(html);
    }
    return DOMPurify.sanitize(html, DEFAULT_CODE_SANITIZE_OPTIONS) as string;
  } catch (_error) {
    return '';
  }
}

/**
 * Strictly sanitize user-generated HTML content
 * Very restrictive - only allows basic formatting tags
 */
export function sanitizeUserHTML(html: string): string {
  try {
    if (typeof window === 'undefined') {
      // Server-side fallback - just escape HTML
      return sanitizeText(html);
    }
    return DOMPurify.sanitize(html, STRICT_SANITIZE_OPTIONS) as string;
  } catch (_error) {
    return '';
  }
}

/**
 * Sanitize text content by escaping HTML entities
 * Safe fallback for when HTML rendering is not needed
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate that a string contains only safe characters for code highlighting
 */
export function isCodeSafe(code: string): boolean {
  // Check for potential XSS patterns
  const dangerousPatterns = [
    /<script[^>]*>.*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /on\w+\s*=/gi, // Event handlers
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(code));
}

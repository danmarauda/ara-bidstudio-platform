'use client';

import { memo, useMemo, type ReactNode, type HTMLProps } from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface OptimizedMarkdownRendererProps {
  content: string;
  className?: string;
  isStreaming?: boolean;
}

/**
 * OptimizedMarkdownRenderer - Fast markdown rendering without heavy syntax highlighting
 * Uses simpler rendering for streaming messages to prevent layout shifts
 */
export const OptimizedMarkdownRenderer = memo(
  function OptimizedMarkdownRenderer({
    content,
    className,
    isStreaming = false,
  }: OptimizedMarkdownRendererProps) {
    // Pre-process content to avoid re-parsing
    const processedContent = useMemo(() => {
      if (!content) {
        return '';
      }
      // For streaming, return content as-is to avoid re-processing
      if (isStreaming) {
        return content;
      }
      // For complete messages, we can do more processing
      return content;
    }, [content, isStreaming]);

    // Use simpler components for faster rendering
    const components = useMemo<Partial<Components>>(
      () => ({
        // Simple code rendering without heavy syntax highlighting
        code: ({ className: codeClassName, children }) => {
          const inline = !codeClassName?.startsWith('language-');
          const match = /language-(\w+)/.exec(codeClassName || '');
          const language = match ? match[1] : '';

          // For streaming, use simple styling
          if (isStreaming || inline) {
            return (
              <code
                className={cn(
                  'rounded bg-muted px-1 py-0.5 font-mono text-sm',
                  inline ? '' : 'my-2 block overflow-x-auto p-3'
                )}
              >
                {children}
              </code>
            );
          }

          // For complete messages, add language badge but skip heavy highlighting
          return (
            <div className="relative my-3">
              {language && (
                <div className="absolute top-0 right-0 rounded-bl bg-muted px-2 py-1 text-xs">
                  {language}
                </div>
              )}
              <pre className="overflow-x-auto rounded-lg bg-muted p-4">
                <code className="font-mono text-sm">
                  {String(children).replace(/\n$/, '')}
                </code>
              </pre>
            </div>
          );
        },

        // Optimized paragraph with proper spacing for readability
        p: ({ children }) => (
          <p className="mb-4 leading-relaxed last:mb-0">{children}</p>
        ),

        // Simplified headings
        h1: ({ children }) => (
          <h1 className="mb-3 font-bold text-xl">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-2 font-semibold text-lg">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-2 font-semibold text-base">{children}</h3>
        ),

        // Simple list styling with better spacing
        ul: ({ children }) => (
          <ul className="mb-4 ml-6 list-disc space-y-1 last:mb-0">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-4 ml-6 list-decimal space-y-1 last:mb-0">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="mb-1 leading-relaxed">{children}</li>
        ),

        // Links
        a: ({ href, children }) => (
          <a
            className="text-primary hover:underline"
            href={href}
            rel="noopener noreferrer"
            target="_blank"
          >
            {children}
          </a>
        ),

        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="my-4 border-muted-foreground/30 border-l-4 pl-4 italic last:mb-0">
            {children}
          </blockquote>
        ),

        // Tables with simple styling
        table: ({ children }) => (
          <div className="my-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted">
            {children}
          </thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-border">
            {children}
          </tbody>
        ),
        tr: ({ children }) => <tr>{children}</tr>,
        th: ({ children }) => (
          <th className="px-3 py-2 text-left font-semibold text-sm">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-sm">
            {children}
          </td>
        ),

        // Horizontal rule
        hr: () => <hr className="my-4 border-border" />,

        // Strong and emphasis
        strong: ({ children }) => (
          <strong className="font-semibold">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic">
            {children}
          </em>
        ),
      }),
      [isStreaming]
    );

    return (
      <div
        className={cn('prose prose-sm dark:prose-invert max-w-none', className)}
      >
        <ReactMarkdown
          components={components}
          remarkPlugins={[remarkGfm]}
          skipHtml
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    );
  }
);

export default OptimizedMarkdownRenderer;

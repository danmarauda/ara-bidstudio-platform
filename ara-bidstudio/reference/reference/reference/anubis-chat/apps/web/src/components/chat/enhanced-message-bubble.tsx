'use client';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import type { ToolCallResult } from '@/lib/types/api';

// Web search result shape used by the UI
interface WebSearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface WebSearchPayload {
  results: WebSearchResult[];
}

// Runtime type guard to narrow ToolCallResult.data for webSearch
const isWebSearchPayload = (data: unknown): data is WebSearchPayload => {
  if (typeof data !== 'object' || data === null) return false;
  const candidate = data as Record<string, unknown>;
  const results = candidate.results;
  if (!Array.isArray(results)) return false;
  return results.every((item) => {
    if (typeof item !== 'object' || item === null) return false;
    const obj = item as Record<string, unknown>;
    return (
      typeof obj.title === 'string' &&
      typeof obj.link === 'string' &&
      typeof obj.snippet === 'string'
    );
  });
};

interface DocumentArtifactPayload {
  document: {
    id?: string;
    title?: string;
    content?: string;
    code?: string;
    type: 'document' | 'code' | 'markdown';
    language?: string;
    framework?: string;
    description?: string;
  };
}

const isDocumentPayload = (data: unknown): data is DocumentArtifactPayload => {
  if (typeof data !== 'object' || data === null) return false;
  const candidate = data as Record<string, unknown>;
  const doc = candidate.document;
  if (typeof doc !== 'object' || doc === null) return false;
  const d = doc as Record<string, unknown>;
  // minimally ensure required shape
  return typeof d.type === 'string';
};
import type { UIMessage } from 'ai';
import { useMutation } from 'convex/react';
import { motion } from 'framer-motion';
import {
  Check,
  Copy,
  Download,
  FileText,
  Image,
  Loader2,
  RefreshCw,
  Share2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  User,
} from 'lucide-react';
import NextImage from 'next/image';
import { useTheme } from 'next-themes';
import { useMemo, useState, memo } from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { createModuleLogger } from '@/lib/utils/logger';

interface EnhancedMessageBubbleProps {
  message: UIMessage & {
    id: string;
    _id?: string;
    createdAt?: number;
    rating?: {
      userRating: 'like' | 'dislike';
      ratedAt: number;
      ratedBy: string;
    };
    actions?: {
      copiedCount?: number;
      sharedCount?: number;
      regeneratedCount?: number;
      lastActionAt?: number;
    };
    attachments?: Array<{
      name?: string;
      contentType?: string;
      url?: string;
    }>;
    toolCalls?: Array<{
      type: string;
      name?: string;
      result?: ToolCallResult;
    }>;
  };
  onRegenerate?: () => void;
  onArtifactClick?: (artifact: {
    id?: string;
    title: string;
    content?: string;
    code?: string;
    type: 'document' | 'code' | 'markdown';
    language?: string;
    framework?: string;
    description?: string;
  }) => void;
  isStreaming?: boolean;
  className?: string;
}

/**
 * Enhanced message bubble with AI SDK message parts support
 * Handles text, tool calls, attachments, and streaming
 */
export const EnhancedMessageBubble = memo(function EnhancedMessageBubbleComponent({
  message,
  onRegenerate,
  onArtifactClick,
  isStreaming = false,
  className,
}: EnhancedMessageBubbleProps) {
  const log = createModuleLogger('enhanced-message-bubble');
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // Auth context for user wallet address
  const { user } = useAuthContext();
  const userWalletAddress = user?.walletAddress;
  const { theme } = useTheme();

  // Convex mutations
  const rateMessage = useMutation(api.messageRating.rateMessage);
  const removeRating = useMutation(api.messageRating.removeRating);
  const trackAction = useMutation(api.messageRating.trackMessageAction);

  // Get current user's rating
  const rating = message.rating;
  const currentRating =
    rating && rating.ratedBy === userWalletAddress ? rating.userRating : null;

  // Handle copy to clipboard
  const handleCopy = async () => {
    const text = message.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('\n');

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Track copy action
    if (message._id || message.id) {
      try {
        await trackAction({
          messageId: (message._id || message.id) as Id<'messages'>,
          action: 'copy',
        });
      } catch (error) {
        log.error('Failed to track copy action', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  };

  // Handle message rating
  const handleRating = async (rating: 'like' | 'dislike') => {
    if (!(userWalletAddress && message._id)) {
      toast.error('Please connect your wallet to rate messages');
      return;
    }

    try {
      if (currentRating === rating) {
        // Remove rating if clicking the same rating
        await removeRating({
          messageId: message._id as Id<'messages'>,
          walletAddress: userWalletAddress,
        });
        toast.success('Rating removed');
      } else {
        // Add or update rating
        await rateMessage({
          messageId: message._id as Id<'messages'>,
          rating,
          walletAddress: userWalletAddress,
        });
        toast.success(`Message ${rating}d`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to rate message: ${message}`);
    }
  };

  // Handle share message
  const handleShare = async () => {
    if (!message.parts?.length) {
      return;
    }

    setSharing(true);
    try {
      const text = message.parts
        .filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('\n');

      if (navigator.share) {
        // Use native sharing if available
        await navigator.share({
          title: 'Anubis Chat Message',
          text,
          url: window.location.href,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(text);
        toast.success('Message copied to clipboard');
      }

      // Track share action
      if (message._id || message.id) {
        try {
          await trackAction({
            messageId: (message._id || message.id) as Id<'messages'>,
            action: 'share',
          });
        } catch (error) {
          log.error('Failed to track share action', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    } catch (_error) {
      toast.error('Failed to share message');
    } finally {
      setSharing(false);
    }
  };

  // Handle regenerate with tracking
  const handleRegenerateWithTracking = async () => {
    if (onRegenerate) {
      onRegenerate();

      // Track regenerate action
      if (message._id || message.id) {
        try {
          await trackAction({
            messageId: (message._id || message.id) as Id<'messages'>,
            action: 'regenerate',
          });
        } catch (error) {
          log.error('Failed to track regenerate action', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  };

  // Memoized markdown components for better performance
  const markdownComponents = useMemo<Partial<Components>>(
    () => ({
      p: ({ children }) => {
        return <p className="mb-4 leading-relaxed last:mb-0">{children}</p>;
      },
      ul: ({ children }) => {
        return (
          <ul className="mb-4 ml-4 list-inside list-disc space-y-1 last:mb-0">
            {children}
          </ul>
        );
      },
      ol: ({ children }) => {
        return (
          <ol className="mb-4 ml-4 list-inside list-decimal space-y-1 last:mb-0">
            {children}
          </ol>
        );
      },
      li: ({ children }) => {
        return <li className="mb-1 leading-relaxed">{children}</li>;
      },
      h1: ({ children }) => {
        return (
          <h1 className="mt-4 mb-3 font-bold text-xl first:mt-0">{children}</h1>
        );
      },
      h2: ({ children }) => {
        return (
          <h2 className="mt-3 mb-2 font-semibold text-lg first:mt-0">
            {children}
          </h2>
        );
      },
      h3: ({ children }) => {
        return (
          <h3 className="mt-2 mb-2 font-semibold text-base first:mt-0">
            {children}
          </h3>
        );
      },
      blockquote: ({ children }) => {
        return (
          <blockquote className="mb-4 border-muted-foreground/30 border-l-4 pl-4 italic last:mb-0">
            {children}
          </blockquote>
        );
      },
      code: ({ className, children }) => {
        const match = /language-(\w+)/.exec(className || '');
        return match ? (
          <div className="relative mb-4 last:mb-0">
            <SyntaxHighlighter language={match[1]} PreTag="div" style={oneDark}>
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
            <Button
              className="absolute top-2 right-2 h-6 w-6"
              onClick={() => {
                navigator.clipboard.writeText(String(children));
              }}
              size="icon"
              variant="ghost"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            {children}
          </code>
        );
      },
      pre: ({ children }) => {
        return <div className="mb-4 last:mb-0">{children}</div>;
      },
      hr: () => {
        return <hr className="my-4 border-border" />;
      },
      a: ({ href, children }) => {
        return (
          <a
            className="text-primary hover:underline"
            href={href}
            rel="noopener noreferrer"
            target="_blank"
          >
            {children}
          </a>
        );
      },
      strong: ({ children }) => {
        return <strong className="font-semibold">{children}</strong>;
      },
      em: ({ children }) => {
        return <em className="italic">{children}</em>;
      },
    }),
    []
  );

  // Render message parts
  const renderPart = (
    part: {
      type: string;
      text?: string;
      mediaType?: string;
      filename?: string;
      url?: string;
      toolName?: string;
      state?: string;
      result?: unknown;
    },
    index: number
  ) => {
    switch (part.type) {
      case 'text':
        return (
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            key={index}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{part.text}</p>
            ) : (
              <ReactMarkdown
                components={markdownComponents}
                remarkPlugins={[remarkGfm]}
              >
                {part.text}
              </ReactMarkdown>
            )}
          </div>
        );

      case 'file':
        if (part.mediaType?.startsWith('image/') && part.url) {
          return (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              key={index}
            >
              <NextImage
                alt={part.filename || 'Image'}
                className="h-auto max-w-full rounded-lg"
                height={400}
                src={part.url}
                unoptimized
                width={600}
              />
              {part.filename && (
                <div className="absolute right-0 bottom-0 left-0 bg-black/50 px-2 py-1 text-white text-xs">
                  {part.filename}
                </div>
              )}
            </motion.div>
          );
        }
        return (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3"
            initial={{ opacity: 0, y: 10 }}
            key={index}
          >
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-sm">{part.filename || 'File'}</span>
            <Button
              className="h-8 w-8"
              onClick={() => window.open(part.url, '_blank')}
              size="icon"
              variant="ghost"
            >
              <Download className="h-4 w-4" />
            </Button>
          </motion.div>
        );

      case 'tool-call':
        return (
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2 text-sm"
            initial={{ opacity: 0, x: -10 }}
            key={index}
          >
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span>Using {part.toolName}</span>
            {part.state === 'partial-call' && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
          </motion.div>
        );

      case 'tool-result':
        return (
          <motion.div
            animate={{ opacity: 1 }}
            className="rounded-lg border bg-muted/30 p-3"
            initial={{ opacity: 0 }}
            key={index}
          >
            <div className="mb-1 font-medium text-muted-foreground text-xs">
              Tool Result
            </div>
            <pre className="overflow-auto text-xs">
              {JSON.stringify(part.result, null, 2)}
            </pre>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'group relative flex gap-3',
          isUser ? 'flex-row-reverse' : 'flex-row',
          className
        )}
        initial={{ opacity: 0, y: 20 }}
      >
        {/* Avatar */}
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage
            alt={isUser ? user?.displayName || 'User' : 'Anubis'}
            src={isUser ? user?.avatar : '/assets/logoNoText.png'}
          />
          <AvatarFallback
            className={cn(
              isUser && theme === 'dark' && 'border border-yellow-500/50'
            )}
          >
            {isUser ? (
              <User
                className={cn(
                  'h-4 w-4',
                  theme === 'dark' ? 'text-yellow-500' : 'text-current'
                )}
              />
            ) : (
              'AI'
            )}
          </AvatarFallback>
        </Avatar>

        {/* Message content */}
        <div
          className={cn(
            'relative max-w-[70%] space-y-2',
            isUser ? 'items-end' : 'items-start'
          )}
        >
          {/* Message bubble */}
          <div
            className={cn(
              'rounded-2xl px-4 py-3',
              isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}
          >
            {/* Render all message parts */}
            <div className="space-y-2">
              {message.parts.map((part, index) => renderPart(part, index))}
            </div>

            {/* Tool Calls */}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.toolCalls.map((toolCall, index) => {
                  // Handle different tool types
                  if (
                    toolCall.name === 'webSearch' &&
                    toolCall.result &&
                    isWebSearchPayload(toolCall.result.data)
                  ) {
                    const { results } = toolCall.result.data;
                    return (
                      <div
                        className="rounded-lg border bg-background/50 p-3"
                        key={index}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">
                            Web Search Results
                          </span>
                        </div>
                        <div className="space-y-2">
                          {results.slice(0, 3).map(
                            (result: WebSearchResult, idx: number) => (
                              <div className="text-sm" key={idx}>
                                <a
                                  className="font-medium text-primary hover:underline"
                                  href={result.link}
                                  rel="noopener noreferrer"
                                  target="_blank"
                                >
                                  {result.title}
                                </a>
                                <p className="mt-1 text-muted-foreground text-xs">
                                  {result.snippet}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (
                    (toolCall.name === 'createDocument' ||
                      toolCall.name === 'generateCode') &&
                    toolCall.result &&
                    isDocumentPayload(toolCall.result.data)
                  ) {
                    const artifact = toolCall.result.data.document;
                    return (
                      <div
                        className="rounded-lg border bg-background/50 p-3"
                        key={index}
                      >
                        <button
                          className="-m-1 flex w-full items-center gap-2 rounded p-1 text-left transition-colors hover:bg-accent/50"
                          onClick={() =>
                            onArtifactClick?.({
                              id: artifact.id,
                              title: artifact.title ?? 'Generated Document',
                              content: artifact.content,
                              code: artifact.code,
                              type: artifact.type,
                              language: artifact.language,
                              framework: artifact.framework,
                              description: artifact.description,
                            })
                          }
                        >
                          <FileText className="h-4 w-4 text-primary" />
                          <div className="flex-1">
                            <span className="font-medium text-sm">
                              {artifact.title || 'Generated Document'}
                            </span>
                            <p className="text-muted-foreground text-xs">
                              Click to view{' '}
                              {artifact.type === 'code' ? 'code' : 'document'}
                            </p>
                          </div>
                        </button>
                      </div>
                    );
                  }

                  // Default tool call display
                  return (
                    <div
                      className="rounded-lg border bg-background/50 p-2"
                      key={index}
                    >
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground text-xs">
                          Tool: {toolCall.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Streaming indicator */}
            {isStreaming && isAssistant && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                className="mt-2 flex items-center gap-1"
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              >
                <div className="h-2 w-2 rounded-full bg-current" />
                <div className="h-2 w-2 rounded-full bg-current" />
                <div className="h-2 w-2 rounded-full bg-current" />
              </motion.div>
            )}
          </div>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {message.attachments.map(
                (
                  attachment: {
                    name?: string;
                    contentType?: string;
                    url?: string;
                  },
                  index: number
                ) => (
                  <motion.div
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-sm"
                    initial={{ opacity: 0, scale: 0.9 }}
                    key={index}
                  >
                    {attachment.contentType?.startsWith('image/') ? (
                      <Image className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    <span className="max-w-[150px] truncate">
                      {attachment.name || 'Attachment'}
                    </span>
                  </motion.div>
                )
              )}
            </div>
          )}

          {/* Timestamp and actions */}
          <div
            className={cn(
              'flex items-center gap-2 text-muted-foreground text-xs',
              isUser ? 'justify-end' : 'justify-start'
            )}
          >
            {message.createdAt && (
              <span>
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}

            {/* Action buttons for assistant messages */}
            {isAssistant && !isStreaming && (
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {/* Rating buttons */}
                <div className="mr-1 flex items-center gap-0.5 border-border/50 border-r pr-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className={cn(
                          'h-6 w-6 transition-colors',
                          currentRating === 'like'
                            ? 'bg-green-50 text-green-600 hover:text-green-700 dark:bg-green-950'
                            : 'text-muted-foreground hover:text-green-600'
                        )}
                        onClick={() => handleRating('like')}
                        size="icon"
                        variant="ghost"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {currentRating === 'like'
                        ? 'Remove like'
                        : 'Like this response'}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className={cn(
                          'h-6 w-6 transition-colors',
                          currentRating === 'dislike'
                            ? 'bg-red-50 text-red-600 hover:text-red-700 dark:bg-red-950'
                            : 'text-muted-foreground hover:text-red-600'
                        )}
                        onClick={() => handleRating('dislike')}
                        size="icon"
                        variant="ghost"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {currentRating === 'dislike'
                        ? 'Remove dislike'
                        : 'Dislike this response'}
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Action buttons */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="h-6 w-6"
                      onClick={handleCopy}
                      size="icon"
                      variant="ghost"
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {copied ? 'Copied!' : 'Copy message'}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="h-6 w-6"
                      disabled={sharing}
                      onClick={handleShare}
                      size="icon"
                      variant="ghost"
                    >
                      {sharing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Share2 className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share message</TooltipContent>
                </Tooltip>

                {onRegenerate && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="h-6 w-6"
                        onClick={handleRegenerateWithTracking}
                        size="icon"
                        variant="ghost"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Regenerate response</TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
});

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, MessageSquare } from 'lucide-react';
import { 
  useCallback, 
  useEffect, 
  useMemo, 
  useRef, 
  useState,
  forwardRef,
  memo
} from 'react';
import { VariableSizeList as List } from 'react-window';
import { EmptyState } from '@/components/data/empty-states';
import { LoadingStates } from '@/components/data/loading-states';
import { Button } from '@/components/ui/button';
import type { ChatMessage, StreamingMessage, ToolCall } from '@/lib/types/api';
import type { MessageListProps, MinimalMessage } from '@/lib/types/components';
import { cn } from '@/lib/utils';
import { type FontSize, getFontSizeClasses } from '@/lib/utils/fontSizes';
import { EnhancedMessageBubble } from './enhanced-message-bubble';
import { StreamingMessage as StreamingMessageComponent } from './streaming-message';
import { TypingIndicator } from './typing-indicator';

// Types for virtual list items
type ListItem = 
  | { type: 'date-separator'; date: string; id: string }
  | { type: 'message'; message: ChatMessage | StreamingMessage | MinimalMessage; id: string }
  | { type: 'typing'; id: string };

// Normalize roles to those supported by the UI bubble component
type UIRole = 'user' | 'assistant' | 'system';
const toUiRole = (role: string): UIRole => {
  if (role === 'tool' || role === 'function') {
    return 'assistant';
  }
  if (role === 'user' || role === 'assistant' || role === 'system') {
    return role;
  }
  return 'assistant';
};

// Memoized row component for better performance
interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    items: ListItem[];
    fontSizes: ReturnType<typeof getFontSizeClasses>;
    onMessageRegenerate?: (messageId: string) => void;
    onArtifactClick?: (artifact: any) => void;
  };
}

const Row = memo(({ index, style, data }: RowProps) => {
  const { items, fontSizes, onMessageRegenerate, onArtifactClick } = data;
  const item = items[index];

  if (!item) return null;

  // Date separator
  if (item.type === 'date-separator') {
    const formatDateSeparator = (dateString: string) => {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      }
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    return (
      <div style={style}>
        <div className="flex items-center justify-center py-1 sm:py-2">
          <div
            className={cn(
              'rounded-full bg-muted px-2 py-1 text-muted-foreground sm:px-3',
              fontSizes.dateSeparator
            )}
          >
            {formatDateSeparator(item.date)}
          </div>
        </div>
      </div>
    );
  }

  // Typing indicator
  if (item.type === 'typing') {
    return (
      <div style={style}>
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start px-2 sm:px-3 md:px-4"
          exit={{ opacity: 0, y: -10 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="max-w-xs">
            <TypingIndicator isTyping={true} />
          </div>
        </motion.div>
      </div>
    );
  }

  // Regular message
  if (item.type === 'message') {
    const message = item.message;

    // Streaming message
    if ('isStreaming' in message && (message as StreamingMessage).isStreaming) {
      return (
        <div style={style} className="px-2 sm:px-3 md:px-4">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            initial={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <StreamingMessageComponent
              content={(message as StreamingMessage).content}
            />
          </motion.div>
        </div>
      );
    }

    // Regular message
    return (
      <div style={style} className="px-2 sm:px-3 md:px-4">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <EnhancedMessageBubble
            message={{
              ...message,
              id: (message as ChatMessage | MinimalMessage)._id,
              parts: [
                {
                  type: 'text',
                  text: (message as ChatMessage | MinimalMessage).content,
                },
              ],
              role: toUiRole(
                String((message as ChatMessage | MinimalMessage).role)
              ),
              rating: (message as MinimalMessage).rating,
              actions: (message as MinimalMessage).actions,
              toolCalls: (message as MinimalMessage & { toolCalls?: ToolCall[] }).toolCalls,
            }}
            onArtifactClick={onArtifactClick}
            onRegenerate={() =>
              onMessageRegenerate?.((message as ChatMessage | MinimalMessage)._id)
            }
          />
        </motion.div>
      </div>
    );
  }

  return null;
});

Row.displayName = 'VirtualRow';

// Custom scrollbar component
const CustomScrollbar = forwardRef<HTMLDivElement>((props, ref) => (
  <div
    ref={ref}
    className="scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent hover:scrollbar-thumb-gray-500"
    {...props}
  />
));

CustomScrollbar.displayName = 'CustomScrollbar';

/**
 * VirtualMessageList component - Virtualized message list for better performance
 * Uses react-window for efficient rendering of large message lists
 */
export function VirtualMessageList({
  messages,
  loading = false,
  onMessageRegenerate,
  onArtifactClick,
  isTyping = false,
  className,
  children,
  fontSize = 'medium',
}: MessageListProps & { isTyping?: boolean; fontSize?: FontSize }) {
  const listRef = useRef<List>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const itemSizeCache = useRef<{ [key: string]: number }>({});
  
  // Get dynamic font size classes
  const fontSizes = useMemo(() => getFontSizeClasses(fontSize), [fontSize]);

  // Prepare list items
  const listItems = useMemo<ListItem[]>(() => {
    if (!messages || messages.length === 0) return [];

    const items: ListItem[] = [];
    let lastDate: string | null = null;

    for (const message of messages) {
      const createdAt =
        'createdAt' in message && message.createdAt
          ? message.createdAt
          : Date.now();
      const messageDate = new Date(createdAt).toDateString();

      // Add date separator if date changed
      if (messageDate !== lastDate) {
        items.push({
          type: 'date-separator',
          date: messageDate,
          id: `date-${messageDate}`,
        });
        lastDate = messageDate;
      }

      // Add message
      const messageId = 
        'id' in message ? (message as StreamingMessage).id :
        '_id' in message ? (message as ChatMessage | MinimalMessage)._id :
        `msg-${Date.now()}`;
      
      items.push({
        type: 'message',
        message,
        id: messageId,
      });
    }

    // Add typing indicator if needed
    if (isTyping) {
      items.push({
        type: 'typing',
        id: 'typing-indicator',
      });
    }

    return items;
  }, [messages, isTyping]);

  // Calculate item sizes dynamically
  const getItemSize = useCallback((index: number) => {
    const item = listItems[index];
    if (!item) return 100; // Default height

    // Return cached size if available
    const cachedSize = itemSizeCache.current[item.id];
    if (cachedSize) return cachedSize;

    // Estimate sizes based on item type
    if (item.type === 'date-separator') {
      return 40; // Date separators are small
    }
    
    if (item.type === 'typing') {
      return 60; // Typing indicator height
    }

    // For messages, estimate based on content length
    if (item.type === 'message') {
      const message = item.message;
      const content = 
        'content' in message ? (message as any).content : '';
      
      // Base height + estimated height based on content
      const lines = Math.ceil(content.length / 80); // Rough estimate
      const estimatedHeight = Math.min(100 + lines * 24, 800); // Cap at 800px
      
      return estimatedHeight;
    }

    return 100; // Default
  }, [listItems]);

  // Handle item size changes
  const handleItemSizeChange = useCallback((index: number, size: number) => {
    const item = listItems[index];
    if (item && itemSizeCache.current[item.id] !== size) {
      itemSizeCache.current[item.id] = size;
      listRef.current?.resetAfterIndex(index);
    }
  }, [listItems]);

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (!listRef.current || listItems.length === 0) return;
    
    const lastIndex = listItems.length - 1;
    listRef.current.scrollToItem(lastIndex, smooth ? 'end' : 'auto');
    setIsAutoScrolling(true);
  }, [listItems]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isAutoScrolling && listItems.length > 0) {
      scrollToBottom(true);
    }
  }, [listItems, isAutoScrolling, scrollToBottom]);

  // Handle scroll events
  const handleScroll = useCallback(({ scrollOffset, scrollUpdateWasRequested }: any) => {
    if (!listRef.current || scrollUpdateWasRequested) return;
    
    const list = listRef.current;
    const totalHeight = listItems.reduce((acc, _, index) => acc + getItemSize(index), 0);
    const viewportHeight = (list as any)._outerRef?.clientHeight || 0;
    const maxScroll = totalHeight - viewportHeight;
    const distanceFromBottom = maxScroll - scrollOffset;
    const isNearBottom = distanceFromBottom < 100;

    setShowScrollButton(!isNearBottom && listItems.length > 0);
    setIsAutoScrolling(isNearBottom);
  }, [listItems, getItemSize]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingStates
          size="lg"
          text="Loading conversation..."
          variant="spinner"
        />
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 sm:p-8">
        <EmptyState
          description="Start the conversation by sending a message below"
          icon={
            <MessageSquare className="h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />
          }
          title="No messages yet"
        />
      </div>
    );
  }

  return (
    <div
      className={cn('relative flex h-full flex-col overflow-hidden', className)}
    >
      <List
        ref={listRef}
        height={window.innerHeight - 200} // Adjust based on your layout
        width="100%"
        itemCount={listItems.length}
        itemSize={getItemSize}
        itemData={{
          items: listItems,
          fontSizes,
          onMessageRegenerate,
          onArtifactClick,
        }}
        onScroll={handleScroll}
        outerElementType={CustomScrollbar}
        className="scrollbar-thin"
      >
        {Row}
      </List>

      {/* Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-4 bottom-4"
            exit={{ opacity: 0, scale: 0.8 }}
            initial={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              className="rounded-full shadow-lg transition-transform hover:scale-110"
              onClick={() => scrollToBottom(true)}
              size="sm"
              variant="secondary"
            >
              <ArrowDown className="h-4 w-4" />
              <span className="sr-only">Scroll to bottom</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </div>
  );
}

export default VirtualMessageList;
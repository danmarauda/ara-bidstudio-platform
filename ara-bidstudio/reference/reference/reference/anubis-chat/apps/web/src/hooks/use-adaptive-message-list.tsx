'use client';

import { useMemo } from 'react';
import type { MessageListProps } from '@/lib/types/components';
import { MessageList } from '@/components/chat/message-list';
import { VirtualMessageList } from '@/components/chat/virtual-message-list';

// Threshold for switching to virtual scrolling
const VIRTUAL_SCROLL_THRESHOLD = 50; // Switch to virtual scrolling after 50 messages

/**
 * Hook that returns the appropriate message list component based on message count
 * Automatically switches to virtual scrolling for better performance with large lists
 */
export function useAdaptiveMessageList() {
  const AdaptiveMessageList = useMemo(() => {
    return function AdaptiveMessageListComponent(
      props: MessageListProps & { isTyping?: boolean; fontSize?: any }
    ) {
      const messageCount = props.messages?.length || 0;
      
      // Use virtual scrolling for large message lists
      if (messageCount > VIRTUAL_SCROLL_THRESHOLD) {
        return <VirtualMessageList {...props} />;
      }
      
      // Use regular scrolling for smaller lists (better for animations)
      return <MessageList {...props} />;
    };
  }, []);

  return AdaptiveMessageList;
}

// Export threshold for reference
export { VIRTUAL_SCROLL_THRESHOLD };
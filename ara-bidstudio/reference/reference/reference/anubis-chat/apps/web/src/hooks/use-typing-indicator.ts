'use client';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useCallback, useEffect, useRef } from 'react';

export function useTypingIndicator(
  chatId: string | undefined,
  walletAddress: string | undefined
) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convex mutations and queries
  const setTyping = useMutation(api.typing.setTyping);
  const typingUsers = useQuery(
    api.typing.getTypingUsers,
    chatId && walletAddress
      ? {
          chatId: chatId as Id<'chats'>,
          excludeWallet: walletAddress,
        }
      : 'skip'
  );

  // Stop typing (declare before startTyping to avoid TDZ issues)
  const stopTyping = useCallback(async () => {
    if (!(chatId && walletAddress)) {
      return;
    }

    try {
      await setTyping({
        chatId: chatId as Id<'chats'>,
        walletAddress,
        isTyping: false,
      });
    } catch (_error) {}

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [chatId, walletAddress, setTyping]);

  // Start typing
  const startTyping = useCallback(async () => {
    if (!(chatId && walletAddress)) {
      return;
    }

    try {
      await setTyping({
        chatId: chatId as Id<'chats'>,
        walletAddress,
        isTyping: true,
      });

      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        void stopTyping();
      }, 3000);
    } catch (_error) {}
  }, [chatId, walletAddress, setTyping, stopTyping]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Stop typing when component unmounts
      void stopTyping();
    };
  }, [stopTyping]);

  return {
    typingUsers: typingUsers || [],
    startTyping,
    stopTyping,
    isAnyoneTyping: (typingUsers?.length || 0) > 0,
  };
}

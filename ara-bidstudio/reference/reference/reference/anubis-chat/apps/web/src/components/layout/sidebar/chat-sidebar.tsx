'use client';

import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import {
  Bot,
  Clock,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { LoadingStates } from '@/components/data/loading-states';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { DEFAULT_MODEL } from '@/lib/constants/ai-models';
import { cn } from '@/lib/utils';

interface ChatSidebarProps {
  selectedChatId?: string;
  onChatSelect?: (chatId: string) => void;
}

export function ChatSidebar({
  selectedChatId,
  onChatSelect,
}: ChatSidebarProps) {
  const { user, isAuthenticated } = useAuthContext();
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [_isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get chat ID from URL if not provided as prop
  const activeChatId =
    selectedChatId || searchParams.get('chatId') || undefined;

  // Use the new authenticated chat query that uses user ID instead of wallet address
  const chats = useQuery(
    api.chatsAuth.getMyChats,
    isAuthenticated ? {} : 'skip'
  );

  const createChat = useMutation(api.chatsAuth.createMyChat);
  const deleteChat = useMutation(api.chatsAuth.deleteMyChat);

  const handleCreateChat = async () => {
    if (!isAuthenticated) {
      return;
    }
    setIsCreatingChat(true);
    try {
      const newChat = await createChat({
        title: `New Chat ${new Date().toLocaleTimeString()}`,
        model: DEFAULT_MODEL.id,
      });
      if (newChat?._id) {
        // Navigate to the chat page with the new chat ID
        router.push(`/chat?chatId=${newChat._id}`);
        if (onChatSelect) {
          onChatSelect(newChat._id);
        }
      }
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleChatSelect = (chatId: string) => {
    // Navigate to the chat page with the selected chat ID
    router.push(`/chat?chatId=${chatId}`);
    if (onChatSelect) {
      onChatSelect(chatId);
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      return;
    }
    await deleteChat({
      id: chatId as Id<'chats'>,
    });
  };

  const formatChatDate = (date: number) => {
    const chatDate = new Date(date);
    const now = new Date();
    const days = Math.floor(
      (now.getTime() - chatDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) {
      return 'Today';
    }
    if (days === 1) {
      return 'Yesterday';
    }
    if (days < 7) {
      return `${days} days ago`;
    }
    return chatDate.toLocaleDateString();
  };

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!(chats && searchQuery)) {
      return chats;
    }
    return chats.filter((chat: Doc<'chats'>) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chats, searchQuery]);

  return (
    <div className="flex h-full flex-col bg-card/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-border border-b px-3 py-2">
        <div className="flex items-center gap-2 transition-transform hover:scale-105">
          <div className="relative">
            <Bot className="h-4 w-4 text-primary" />
            <Sparkles className="-right-1 -top-1 absolute h-2.5 w-2.5 animate-pulse text-accent" />
          </div>
          <h2 className="font-semibold text-sm">Chat History</h2>
        </div>
        <Button
          aria-label="Start new chat"
          className="h-6 px-1.5 shadow-sm"
          disabled={isCreatingChat}
          onClick={handleCreateChat}
          size="sm"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Search Bar */}
      {chats && chats.length > 3 && (
        <div className="border-border/50 border-b p-2 transition-all">
          <div className="relative">
            <Search className="-translate-y-1/2 absolute top-1/2 left-2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              className="w-full rounded-md bg-background/50 px-7 py-1.5 text-xs transition-colors placeholder:text-muted-foreground focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/50"
              onBlur={() => setIsSearching(false)}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearching(true)}
              placeholder="Search chats..."
              value={searchQuery}
            />
            {searchQuery && (
              <button
                className="-translate-y-1/2 absolute top-1/2 right-2 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-hidden p-2">
        {chats === undefined ? (
          <div className="animate-fade-in p-2">
            <LoadingStates variant="skeleton" />
          </div>
        ) : chats.length === 0 ? (
          <div className="animate-fade-in rounded-md border border-border/50 p-4 text-center text-muted-foreground text-xs">
            <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" />
            No conversations yet
          </div>
        ) : (
          <div className="relative flex h-full flex-col">
            {/* Fade overlay at bottom when scrollable */}
            {filteredChats && filteredChats.length > 3 && (
              <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-8 bg-gradient-to-t from-background to-transparent" />
            )}

            {/* Chat list container */}
            <div
              className={cn(
                'relative space-y-1 overflow-y-auto',
                'max-h-[calc(100vh-200px)]',
                filteredChats && filteredChats.length > 3 && 'pr-2'
              )}
              style={{
                scrollBehavior: 'smooth',
                scrollbarWidth: 'thin',
              }}
            >
              {filteredChats && filteredChats.length === 0 && searchQuery ? (
                <div className="animate-fade-in py-4 text-center text-muted-foreground text-xs">
                  No chats found
                </div>
              ) : (
                filteredChats?.map((chat: Doc<'chats'>, index: number) => (
                  <div
                    className={cn(
                      'group flex animate-fade-in cursor-pointer items-center gap-2 rounded-md px-2 py-2 transition-all',
                      'hover:translate-x-1',
                      activeChatId === chat._id
                        ? 'bg-primary/10 shadow-sm ring-1 ring-primary/20'
                        : 'hover:bg-muted/50'
                    )}
                    key={chat._id}
                    onClick={() => handleChatSelect(chat._id)}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <MessageSquare
                      className={cn(
                        'h-4 w-4 flex-shrink-0 transition-colors',
                        activeChatId === chat._id
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'truncate text-sm transition-colors',
                          activeChatId === chat._id && 'font-medium'
                        )}
                      >
                        {chat.title}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" />
                        <span>{formatChatDate(chat._creationTime)}</span>
                      </div>
                    </div>
                    <Button
                      className="h-6 w-6 flex-shrink-0 opacity-0 transition-all group-hover:opacity-100"
                      onClick={(e) => handleDeleteChat(chat._id, e)}
                      size="icon"
                      variant="ghost"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Chat count indicator */}
            {filteredChats && filteredChats.length > 5 && (
              <div className="mt-2 animate-fade-in border-border/50 border-t pt-2">
                <p className="text-center text-[10px] text-muted-foreground">
                  {searchQuery
                    ? `Showing ${filteredChats.length} of ${chats?.length || 0} chats`
                    : `${filteredChats.length} total chats`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

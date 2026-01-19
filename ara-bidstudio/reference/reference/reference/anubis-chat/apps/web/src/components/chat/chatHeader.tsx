'use client';

import {
  Bot,
  Brain,
  Check,
  Edit3,
  Filter,
  Info,
  Loader2,
  MoreVertical,
  RefreshCw,
  Settings,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ChatHeaderProps } from '@/lib/types/components';
import { cn } from '@/lib/utils';
import { TokenUsageDisplay } from './token-usage-display';

/**
 * ChatHeader component - Header for individual chats
 * Displays chat info and provides chat management actions
 */
export function ChatHeader({
  chat,
  selectedAgent,
  onRename,
  onClearHistory,
  onDelete,
  onGenerateTitle,
  onSettingsClick,
  onModelSelectorClick,
  onAgentSelectorClick,
  className,
  children,
}: ChatHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(chat.title);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [showTokenUsage, setShowTokenUsage] = useState(false);

  // Update editingTitle when chat.title changes (e.g., after generation)
  React.useEffect(() => {
    if (!isEditing) {
      setEditingTitle(chat.title);
    }
  }, [chat.title, isEditing]);

  const handleSaveTitle = () => {
    if (editingTitle.trim() && editingTitle !== chat.title) {
      onRename?.(editingTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditingTitle(chat.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleGenerateTitle = async () => {
    if (!onGenerateTitle || isGeneratingTitle) {
      return;
    }

    setIsGeneratingTitle(true);
    try {
      await onGenerateTitle();
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const _getModelDisplayName = (model: string) => {
    if (model.includes('gpt-4')) {
      return 'GPT-4';
    }
    if (model.includes('gpt-3.5')) {
      return 'GPT-3.5';
    }
    if (model.includes('claude')) {
      return 'Claude';
    }
    if (model.includes('deepseek')) {
      return 'DeepSeek';
    }
    if (model.includes('llama')) {
      return 'Llama';
    }
    return model.split('-')[0]?.toUpperCase() ?? 'AI';
  };

  const _getModelColor = (model: string) => {
    if (model.includes('gpt-4')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    if (model.includes('gpt-3.5')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
    if (model.includes('claude')) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    }
    if (model.includes('deepseek')) {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  return (
    <>
      {/* Mobile Token Usage Modal */}
      {chat.tokenUsage && showTokenUsage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowTokenUsage(false)}
          />
          <div className="relative z-10 w-full max-w-sm">
            <TokenUsageDisplay
              className="bg-background"
              showDetails={true}
              tokenUsage={chat.tokenUsage}
            />
            <Button
              className="-top-2 -right-2 absolute h-6 w-6 rounded-full p-0"
              onClick={() => setShowTokenUsage(false)}
              size="sm"
              variant="secondary"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <div className={cn('flex items-center gap-2', className)}>
        {/* Actions Menu on mobile - moved to left side */}
        <div className="flex-shrink-0 sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="button-press h-8 w-8 p-0"
                size="icon"
                variant="outline"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-48">
              {/* Chat Settings - Primary option */}
              {onSettingsClick && (
                <DropdownMenuItem onClick={onSettingsClick}>
                  <Settings className="mr-2 h-4 w-4" />
                  Chat Settings
                </DropdownMenuItem>
              )}

              {/* Token Usage - Mobile */}
              {chat.tokenUsage && (
                <DropdownMenuItem
                  onClick={() => setShowTokenUsage(!showTokenUsage)}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Token Usage
                </DropdownMenuItem>
              )}

              {/* Model and Agent selection */}
              {onModelSelectorClick && (
                <DropdownMenuItem onClick={onModelSelectorClick}>
                  <Brain className="mr-2 h-4 w-4" />
                  Select Model
                </DropdownMenuItem>
              )}

              {onAgentSelectorClick && (
                <DropdownMenuItem onClick={onAgentSelectorClick}>
                  <Bot className="mr-2 h-4 w-4" />
                  Select Agent
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {/* Chat management options */}
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit3 className="mr-2 h-4 w-4" />
                Rename Chat
              </DropdownMenuItem>

              {onGenerateTitle && (
                <DropdownMenuItem
                  disabled={isGeneratingTitle}
                  onClick={handleGenerateTitle}
                >
                  {isGeneratingTitle ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {isGeneratingTitle ? 'Generating...' : 'Generate Title'}
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={onClearHistory}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Clear History
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                onClick={onDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Chat Icon */}
        <div className="flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
        </div>

        {/* Chat Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <div className="flex flex-1 items-center space-x-1">
                <Input
                  autoFocus
                  className="h-6 flex-1 text-sm"
                  onBlur={handleSaveTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Chat title"
                  value={editingTitle}
                />
                <Button
                  className="h-6 w-6 p-0"
                  onClick={handleSaveTitle}
                  size="sm"
                  variant="ghost"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  className="h-6 w-6 p-0"
                  onClick={handleCancelEdit}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="group flex flex-1 items-center gap-2 overflow-hidden">
                {/* Mobile chat name - displays title, click to rename */}
                <div className="flex max-w-[8rem] items-center sm:hidden">
                  <Button
                    className="button-press h-auto justify-start rounded-lg bg-primary/20 p-1 px-2 shadow-md hover:bg-primary/30 hover:shadow-lg dark:bg-primary/10 dark:hover:bg-primary/20"
                    onClick={() => setIsEditing(true)}
                    size="sm"
                    title="Click to rename chat"
                    variant="ghost"
                  >
                    <span className="truncate font-medium text-black text-sm dark:text-white">
                      {chat.title}
                    </span>
                  </Button>
                </div>

                {/* Desktop version */}
                <button
                  className="hidden truncate font-medium text-sm transition-colors hover:text-primary sm:block"
                  onClick={() => setIsEditing(true)}
                  title={chat.title}
                  type="button"
                >
                  {chat.title}
                </button>
                <Button
                  className="hidden h-4 w-4 flex-shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100 sm:flex"
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  variant="ghost"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Chat Status */}
          <div className="flex items-center space-x-2 text-muted-foreground text-xs">
            {selectedAgent && (
              <span className="flex items-center space-x-1">
                <Bot className="h-3 w-3" />
                <span>{selectedAgent.name}</span>
              </span>
            )}

            {chat.systemPrompt && (
              <>
                {selectedAgent && <span>•</span>}
                <span className="flex items-center space-x-1">
                  <Info className="h-3 w-3" />
                  <span>Custom prompt</span>
                </span>
              </>
            )}

            {chat.temperature && chat.temperature !== 0.7 && (
              <>
                {(chat.systemPrompt || selectedAgent) && <span>•</span>}
                <span>Temp: {chat.temperature}</span>
              </>
            )}
          </div>
        </div>

        {/* Agent Selector Button - Desktop */}
        {onAgentSelectorClick && (
          <div className="hidden flex-shrink-0 sm:block">
            <Button
              className="button-press min-w-[120px] justify-between"
              onClick={onAgentSelectorClick}
              size="sm"
              variant="outline"
            >
              <div className="flex items-center space-x-1.5">
                <Bot className="h-3.5 w-3.5" />
                <span className="truncate font-medium text-xs">
                  {selectedAgent ? selectedAgent.name : 'Select Agent'}
                </span>
              </div>
              <Filter className="h-3 w-3 opacity-50" />
            </Button>
          </div>
        )}

        {/* Token Usage Button - Desktop */}
        {chat.tokenUsage && (
          <div className="hidden flex-shrink-0 sm:block">
            <TooltipProvider>
              <Tooltip onOpenChange={setShowTokenUsage} open={showTokenUsage}>
                <TooltipTrigger asChild>
                  <Button
                    className="button-press h-8 w-8 p-0"
                    onClick={() => setShowTokenUsage(!showTokenUsage)}
                    size="icon"
                    variant="ghost"
                  >
                    <Zap className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="border-0 p-0" side="bottom">
                  <TokenUsageDisplay
                    showDetails={true}
                    tokenUsage={chat.tokenUsage}
                  />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Desktop Actions Menu - three dots */}
        <div className="hidden flex-shrink-0 sm:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="button-press h-8 w-8 p-0"
                size="icon"
                variant="ghost"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              {/* Always visible options */}
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit3 className="mr-2 h-4 w-4" />
                Rename Chat
              </DropdownMenuItem>

              {onGenerateTitle && (
                <DropdownMenuItem
                  disabled={isGeneratingTitle}
                  onClick={handleGenerateTitle}
                >
                  {isGeneratingTitle ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {isGeneratingTitle ? 'Generating...' : 'Generate Title'}
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={onClearHistory}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Clear History
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                onClick={onDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {children}
      </div>
    </>
  );
}

export default ChatHeader;

/**
 * Optimistic UI component for message actions
 * Provides immediate feedback for user interactions like reactions, copying, etc.
 */

'use client';

import { useState, useCallback, useTransition } from 'react';
import { Heart, Copy, RotateCcw, Share, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface OptimisticMessageActionsProps {
  messageId: string;
  content: string;
  onReaction?: (messageId: string, reaction: 'like' | 'dislike') => Promise<void>;
  onCopy?: (messageId: string) => Promise<void>;
  onRegenerate?: (messageId: string) => Promise<void>;
  onShare?: (messageId: string) => Promise<void>;
  className?: string;
  isAssistant?: boolean;
  initialReaction?: 'like' | 'dislike' | null;
  disabled?: boolean;
}

interface ActionState {
  isLoading: boolean;
  isSuccess: boolean;
  error?: string;
}

/**
 * OptimisticMessageActions - Provides immediate UI feedback for message interactions
 */
export function OptimisticMessageActions({
  messageId,
  content,
  onReaction,
  onCopy,
  onRegenerate,
  onShare,
  className,
  isAssistant = false,
  initialReaction = null,
  disabled = false
}: OptimisticMessageActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [reaction, setReaction] = useState<'like' | 'dislike' | null>(initialReaction);
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});

  const updateActionState = useCallback((action: string, state: Partial<ActionState>) => {
    setActionStates(prev => ({
      ...prev,
      [action]: { ...prev[action], ...state }
    }));
  }, []);

  const handleReaction = useCallback(async (newReaction: 'like' | 'dislike') => {
    if (disabled || !onReaction) return;

    // Optimistic update
    const previousReaction = reaction;
    const finalReaction = reaction === newReaction ? null : newReaction;
    setReaction(finalReaction);

    updateActionState('reaction', { isLoading: true, error: undefined });

    startTransition(async () => {
      try {
        await onReaction(messageId, newReaction);
        updateActionState('reaction', { isLoading: false, isSuccess: true });
        
        // Show success feedback
        toast.success(finalReaction ? `Reaction ${finalReaction}d` : 'Reaction removed');
      } catch (error) {
        // Revert optimistic update on error
        setReaction(previousReaction);
        updateActionState('reaction', { 
          isLoading: false, 
          isSuccess: false, 
          error: error instanceof Error ? error.message : 'Failed to update reaction' 
        });
        toast.error('Failed to update reaction');
      }
    });
  }, [reaction, disabled, onReaction, messageId, updateActionState]);

  const handleCopy = useCallback(async () => {
    if (disabled || !onCopy) return;

    updateActionState('copy', { isLoading: true, error: undefined });

    startTransition(async () => {
      try {
        // Optimistic clipboard update
        await navigator.clipboard.writeText(content);
        await onCopy(messageId);
        
        updateActionState('copy', { isLoading: false, isSuccess: true });
        toast.success('Message copied to clipboard');
        
        // Reset success state after a delay
        setTimeout(() => {
          updateActionState('copy', { isSuccess: false });
        }, 2000);
      } catch (error) {
        updateActionState('copy', { 
          isLoading: false, 
          isSuccess: false, 
          error: error instanceof Error ? error.message : 'Failed to copy message' 
        });
        toast.error('Failed to copy message');
      }
    });
  }, [disabled, onCopy, messageId, content, updateActionState]);

  const handleRegenerate = useCallback(async () => {
    if (disabled || !onRegenerate) return;

    updateActionState('regenerate', { isLoading: true, error: undefined });

    startTransition(async () => {
      try {
        await onRegenerate(messageId);
        updateActionState('regenerate', { isLoading: false, isSuccess: true });
        toast.success('Regenerating response...');
      } catch (error) {
        updateActionState('regenerate', { 
          isLoading: false, 
          isSuccess: false, 
          error: error instanceof Error ? error.message : 'Failed to regenerate message' 
        });
        toast.error('Failed to regenerate message');
      }
    });
  }, [disabled, onRegenerate, messageId, updateActionState]);

  const handleShare = useCallback(async () => {
    if (disabled || !onShare) return;

    updateActionState('share', { isLoading: true, error: undefined });

    startTransition(async () => {
      try {
        await onShare(messageId);
        updateActionState('share', { isLoading: false, isSuccess: true });
        toast.success('Message shared');
        
        // Reset success state after a delay
        setTimeout(() => {
          updateActionState('share', { isSuccess: false });
        }, 2000);
      } catch (error) {
        updateActionState('share', { 
          isLoading: false, 
          isSuccess: false, 
          error: error instanceof Error ? error.message : 'Failed to share message' 
        });
        toast.error('Failed to share message');
      }
    });
  }, [disabled, onShare, messageId, updateActionState]);

  const copyState = actionStates.copy || {};
  const reactionState = actionStates.reaction || {};
  const regenerateState = actionStates.regenerate || {};
  const shareState = actionStates.share || {};

  return (
    <TooltipProvider>
      <div className={cn(
        'flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100',
        (isPending || Object.values(actionStates).some(state => state.isLoading)) && 'opacity-100',
        className
      )}>
        {/* Reaction buttons */}
        {onReaction && (
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction('like')}
                  disabled={disabled || reactionState.isLoading}
                  className={cn(
                    'h-6 w-6 p-0',
                    reaction === 'like' && 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                  )}
                >
                  {reactionState.isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Heart className={cn(
                      'h-3 w-3',
                      reaction === 'like' && 'fill-current'
                    )} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{reaction === 'like' ? 'Remove like' : 'Like message'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Copy button */}
        {onCopy && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                disabled={disabled || copyState.isLoading}
                className="h-6 w-6 p-0"
              >
                {copyState.isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : copyState.isSuccess ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy message</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Regenerate button (only for assistant messages) */}
        {isAssistant && onRegenerate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                disabled={disabled || regenerateState.isLoading}
                className="h-6 w-6 p-0"
              >
                {regenerateState.isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RotateCcw className="h-3 w-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Regenerate response</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Share button */}
        {onShare && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                disabled={disabled || shareState.isLoading}
                className="h-6 w-6 p-0"
              >
                {shareState.isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : shareState.isSuccess ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Share className="h-3 w-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share message</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

export default OptimisticMessageActions;
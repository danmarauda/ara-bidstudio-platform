'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  FileText,
  Image,
  Loader2,
  Paperclip,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useCallback, useRef, useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { createModuleLogger } from '@/lib/utils/logger';

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  preview?: string;
}

interface EnhancedMessageInputProps {
  onSend: (
    content: string,
    options?: {
      attachments?: Attachment[];
      useReasoning?: boolean;
    }
  ) => Promise<void>;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
  isStreaming?: boolean;
  className?: string;
}

/**
 * Enhanced message input with AI SDK integration
 * Modern design with smooth animations and attachment support
 */
export const EnhancedMessageInput = memo(function EnhancedMessageInputComponent({
  onSend,
  onTyping,
  disabled = false,
  placeholder = 'Message Anubis...',
  isStreaming = false,
  className,
}: EnhancedMessageInputProps) {
  const log = createModuleLogger('enhanced-message-input');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [useReasoning, setUseReasoning] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, []);

  // Handle send
  const handleSend = async () => {
    const content = message.trim();
    if ((!content && attachments.length === 0) || disabled || isSending) {
      return;
    }

    setIsSending(true);
    try {
      await onSend(content, {
        attachments: attachments.length > 0 ? attachments : undefined,
        useReasoning,
      });

      // Clear inputs on success
      setMessage('');
      setAttachments([]);
      setUseReasoning(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      log.error('Failed to send message', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    onTyping?.();
  };

  // Handle file selection
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const newAttachments: Attachment[] = [];

    for (const file of Array.from(files)) {
      // Create object URL for preview
      const url = URL.createObjectURL(file);

      newAttachments.push({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        url,
        preview: file.type.startsWith('image/') ? url : undefined,
      });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Remove attachment
  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id);
      if (attachment?.preview) {
        URL.revokeObjectURL(attachment.preview);
      }
      return prev.filter((a) => a.id !== id);
    });
  };

  const canSend =
    (message.trim().length > 0 || attachments.length > 0) &&
    !disabled &&
    !isSending;

  return (
    <TooltipProvider>
      <div className={cn('relative w-full', className)}>
        {/* Reasoning Mode Warning Banner - DISABLED FOR NOW */}
        {/* <AnimatePresence>
          {useReasoning && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-2"
            >
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  <span className="font-semibold">Enhanced Reasoning Active:</span> This message will use 2 of your message credits
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence> */}

        {/* Drag overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl border-2 border-primary border-dashed bg-primary/10 backdrop-blur-sm"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
            >
              <div className="text-center">
                <Paperclip className="mx-auto mb-2 h-8 w-8 text-primary" />
                <p className="font-medium text-sm">Drop files here</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main input container */}
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300',
            isDragging && 'border-primary ring-2 ring-primary/20',
            disabled && 'opacity-50',
            'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5'
          )}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Attachments preview */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div
                animate={{ height: 'auto', opacity: 1 }}
                className="border-b p-2"
                exit={{ height: 0, opacity: 0 }}
                initial={{ height: 0, opacity: 0 }}
              >
                <div className="flex flex-wrap gap-2">
                  {attachments.map((attachment) => (
                    <motion.div
                      animate={{ scale: 1, opacity: 1 }}
                      className="group relative flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 transition-colors hover:bg-primary/10"
                      exit={{ scale: 0.8, opacity: 0 }}
                      initial={{ scale: 0.8, opacity: 0 }}
                      key={attachment.id}
                    >
                      {attachment.preview ? (
                        <img
                          alt={attachment.name}
                          className="h-6 w-6 rounded object-cover"
                          src={attachment.preview}
                        />
                      ) : attachment.type.startsWith('image/') ? (
                        <Image className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="max-w-[150px] truncate text-sm">
                        {attachment.name}
                      </span>
                      <button
                        className="ml-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-destructive/20 group-hover:opacity-100"
                        onClick={() => removeAttachment(attachment.id)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input area */}
          <div className="flex items-end gap-2 p-3">
            {/* Attachment button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="h-9 w-9 shrink-0 text-muted-foreground transition-colors hover:text-primary"
                  disabled={disabled}
                  onClick={() => fileInputRef.current?.click()}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach files</TooltipContent>
            </Tooltip>

            {/* Textarea */}
            <Textarea
              className="min-h-[40px] resize-none border-0 bg-transparent p-0 text-base focus-visible:ring-0"
              disabled={disabled || isStreaming}
              onChange={(e) => {
                setMessage(e.target.value);
                adjustTextareaHeight();
                onTyping?.();
              }}
              onKeyDown={handleKeyDown}
              placeholder={isStreaming ? 'Anubis is thinking...' : placeholder}
              ref={textareaRef}
              rows={1}
              value={message}
            />

            {/* Action buttons */}
            <div className="flex shrink-0 items-center gap-1">
              {/* Reasoning toggle - DISABLED FOR NOW (will be enabled after launch) */}
              {/* <Popover>
                <Tooltip>
                  <PopoverTrigger asChild>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant={useReasoning ? 'default' : 'ghost'}
                        className={cn(
                          "h-9 w-9 transition-all relative",
                          useReasoning && "bg-yellow-500 hover:bg-yellow-600 text-black shadow-lg shadow-yellow-500/20"
                        )}
                        disabled={disabled}
                      >
                        <Brain className="h-4 w-4" />
                        {useReasoning && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                          </span>
                        )}
                      </Button>
                    </TooltipTrigger>
                  </PopoverTrigger>
                  <TooltipContent>
                    {useReasoning ? 'Enhanced reasoning (2x message cost)' : 'Enable enhanced reasoning'}
                  </TooltipContent>
                </Tooltip>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Enhanced Reasoning</h4>
                      <Button
                        size="sm"
                        variant={useReasoning ? 'default' : 'outline'}
                        onClick={() => setUseReasoning(!useReasoning)}
                        className={cn(
                          useReasoning && "bg-yellow-500 hover:bg-yellow-600 text-black"
                        )}
                      >
                        {useReasoning ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                    
                    <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-2.5">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                            Uses 2 messages per request
                          </p>
                          <p className="text-xs text-yellow-800 dark:text-yellow-200">
                            Enhanced reasoning mode consumes twice your normal message quota for deeper analysis and step-by-step thinking.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      Enable multi-step reasoning for complex questions. The AI will think through problems systematically, showing its reasoning process.
                    </p>
                  </div>
                </PopoverContent>
              </Popover> */}

              {/* Send button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className={cn(
                      'h-9 w-9 transition-all',
                      canSend &&
                        'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90'
                    )}
                    disabled={!canSend}
                    onClick={handleSend}
                    size="icon"
                    variant={canSend ? 'default' : 'ghost'}
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isStreaming ? (
                      <Sparkles className="h-4 w-4 animate-pulse" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isSending
                    ? 'Sending...'
                    : isStreaming
                      ? 'Anubis is responding...'
                      : 'Send message'}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            className="hidden"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            ref={fileInputRef}
            type="file"
          />

          {/* Drag overlay */}
          <AnimatePresence>
            {isDragging && (
              <motion.div
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-primary border-dashed bg-primary/10 backdrop-blur-sm"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
              >
                <div className="text-center">
                  <Paperclip className="mx-auto mb-2 h-8 w-8 animate-bounce text-primary" />
                  <p className="font-medium text-primary">
                    Drop files to attach
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Character count (optional) */}
        {message.length > 3000 && (
          <div className="mt-1 text-right text-muted-foreground text-xs">
            {message.length} / 4000
          </div>
        )}
      </div>
    </TooltipProvider>
  );
});

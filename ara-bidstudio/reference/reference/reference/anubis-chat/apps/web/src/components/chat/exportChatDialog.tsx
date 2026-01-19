'use client';

import { Copy, Download, FileJson, FileText } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radioGroup';

interface Message {
  role: string;
  content: string;
  createdAt?: Date | number;
  metadata?: Record<string, unknown>;
}

interface ExportChatDialogProps {
  messages: Message[];
  chatTitle?: string;
  trigger?: React.ReactNode;
}

type ExportFormat = 'markdown' | 'json' | 'text';

export function ExportChatDialog({
  messages,
  chatTitle = 'Chat Export',
  trigger,
}: ExportChatDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('markdown');

  const formatMessage = (message: Message, fmt: ExportFormat): string => {
    const timestamp = message.createdAt
      ? new Date(message.createdAt).toLocaleString()
      : '';

    switch (fmt) {
      case 'markdown':
        return `### ${message.role === 'user' ? '👤 You' : '🤖 Assistant'} ${timestamp ? `- ${timestamp}` : ''}\n\n${message.content}\n\n---\n`;

      case 'text':
        return `[${message.role.toUpperCase()}] ${timestamp ? `(${timestamp})` : ''}\n${message.content}\n\n`;

      case 'json':
        return ''; // Handled separately

      default:
        return message.content;
    }
  };

  const exportChat = (fmt: ExportFormat, download = true) => {
    let content: string;
    let mimeType: string;
    let extension: string;

    switch (fmt) {
      case 'markdown':
        content = `# ${chatTitle}\n\nExported on ${new Date().toLocaleString()}\n\n---\n\n`;
        content += messages.map((m) => formatMessage(m, fmt)).join('\n');
        mimeType = 'text/markdown';
        extension = 'md';
        break;

      case 'text':
        content = `${chatTitle}\nExported on ${new Date().toLocaleString()}\n\n${'='.repeat(50)}\n\n`;
        content += messages.map((m) => formatMessage(m, fmt)).join('');
        mimeType = 'text/plain';
        extension = 'txt';
        break;

      case 'json': {
        const jsonData = {
          title: chatTitle,
          exportedAt: new Date().toISOString(),
          messageCount: messages.length,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
            timestamp: m.createdAt ? new Date(m.createdAt).toISOString() : null,
            metadata: m.metadata || {},
          })),
        };
        content = JSON.stringify(jsonData, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;
      }

      default:
        return;
    }

    if (download) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${chatTitle.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Chat exported as ${extension.toUpperCase()}`);
    } else {
      navigator.clipboard
        .writeText(content)
        .then(() => {
          toast.success('Chat copied to clipboard');
        })
        .catch(() => {
          toast.error('Failed to copy to clipboard');
        });
    }

    setIsOpen(false);
  };

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Chat</DialogTitle>
          <DialogDescription>
            Choose a format to export your conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup
            onValueChange={(v: string) => setFormat(v as ExportFormat)}
            value={format}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="markdown" value="markdown" />
              <Label
                className="flex cursor-pointer items-center gap-2"
                htmlFor="markdown"
              >
                <FileText className="h-4 w-4" />
                Markdown (.md)
                <span className="text-muted-foreground text-xs">
                  Best for documentation
                </span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="text" value="text" />
              <Label
                className="flex cursor-pointer items-center gap-2"
                htmlFor="text"
              >
                <FileText className="h-4 w-4" />
                Plain Text (.txt)
                <span className="text-muted-foreground text-xs">
                  Simple and universal
                </span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="json" value="json" />
              <Label
                className="flex cursor-pointer items-center gap-2"
                htmlFor="json"
              >
                <FileJson className="h-4 w-4" />
                JSON (.json)
                <span className="text-muted-foreground text-xs">
                  For developers
                </span>
              </Label>
            </div>
          </RadioGroup>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => exportChat(format, true)}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button
              className="flex-1"
              onClick={() => exportChat(format, false)}
              variant="outline"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

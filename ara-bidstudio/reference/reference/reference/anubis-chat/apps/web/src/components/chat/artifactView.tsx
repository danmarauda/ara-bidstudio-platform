'use client';

import {
  CheckCircle,
  Code,
  Copy,
  Download,
  FileText,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ArtifactData {
  id?: string;
  title: string;
  content?: string;
  code?: string;
  type: 'document' | 'code' | 'markdown';
  language?: string;
  framework?: string;
  description?: string;
  createdAt?: string;
}

interface ArtifactViewProps {
  artifact: ArtifactData | null;
  onClose: () => void;
  isOpen: boolean;
  className?: string;
}

export function ArtifactView({
  artifact,
  onClose,
  isOpen,
  className,
}: ArtifactViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!(isOpen && artifact)) {
    return null;
  }

  const handleCopy = async () => {
    const textToCopy = artifact.code || artifact.content || '';
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (_err) {
      toast.error('Failed to copy');
    }
  };

  const handleDownload = () => {
    const content = artifact.code || artifact.content || '';
    const type = artifact.type === 'code' ? 'text/plain' : 'text/markdown';
    const extension =
      artifact.type === 'code' ? `.${artifact.language || 'txt'}` : '.md';

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.replace(/\s+/g, '-').toLowerCase()}${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded successfully');
  };

  const renderContent = () => {
    if (artifact.type === 'code' && artifact.code) {
      return (
        <div className="h-full overflow-auto">
          <SyntaxHighlighter
            customStyle={{
              margin: 0,
              borderRadius: 0,
              fontSize: '14px',
              lineHeight: '1.5',
            }}
            language={artifact.language || 'typescript'}
            showLineNumbers
            style={vscDarkPlus}
          >
            {artifact.code}
          </SyntaxHighlighter>
        </div>
      );
    }

    if (artifact.type === 'markdown' || artifact.type === 'document') {
      return (
        <div className="prose prose-sm dark:prose-invert h-full max-w-none overflow-auto p-6">
          <pre className="whitespace-pre-wrap break-words text-sm">
            {artifact.content || ''}
          </pre>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-background/95 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <Card className="absolute inset-4 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
              {artifact.type === 'code' ? (
                <Code className="h-5 w-5 text-muted-foreground" />
              ) : (
                <FileText className="h-5 w-5 text-muted-foreground" />
              )}
              <h3 className="truncate font-semibold">{artifact.title}</h3>
              {artifact.language && (
                <span className="text-muted-foreground text-xs">
                  ({artifact.language})
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                className="h-8 w-8"
                onClick={handleCopy}
                size="icon"
                variant="ghost"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                className="h-8 w-8"
                onClick={handleDownload}
                size="icon"
                variant="ghost"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                className="h-8 w-8"
                onClick={onClose}
                size="icon"
                variant="ghost"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">{renderContent()}</div>
        </Card>
      </div>

      {/* Desktop Split View */}
      <div
        className={cn(
          'hidden lg:block',
          'transition-all duration-300 ease-in-out',
          isFullscreen ? 'fixed inset-0 z-50' : 'relative',
          isOpen ? 'w-1/2' : 'w-0',
          className
        )}
      >
        <Card
          className={cn(
            'flex h-full flex-col overflow-hidden',
            isFullscreen && 'rounded-none'
          )}
        >
          <div className="flex items-center justify-between border-b bg-muted/50 p-4">
            <div className="flex items-center gap-2">
              {artifact.type === 'code' ? (
                <Code className="h-5 w-5 text-muted-foreground" />
              ) : (
                <FileText className="h-5 w-5 text-muted-foreground" />
              )}
              <h3 className="truncate font-semibold">{artifact.title}</h3>
              {artifact.language && (
                <span className="text-muted-foreground text-xs">
                  ({artifact.language})
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                className="h-8 w-8"
                onClick={handleCopy}
                size="icon"
                title="Copy to clipboard"
                variant="ghost"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                className="h-8 w-8"
                onClick={handleDownload}
                size="icon"
                title="Download"
                variant="ghost"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                className="h-8 w-8"
                onClick={() => setIsFullscreen(!isFullscreen)}
                size="icon"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                variant="ghost"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                className="h-8 w-8"
                onClick={onClose}
                size="icon"
                title="Close"
                variant="ghost"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden bg-background">
            {renderContent()}
          </div>
          {artifact.description && (
            <div className="border-t bg-muted/30 p-3">
              <p className="text-muted-foreground text-xs">
                {artifact.description}
              </p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

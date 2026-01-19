'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  Crown,
  Download,
  Eye,
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { UpgradePrompt } from '@/components/auth/upgradePrompt';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  getUploadRecommendations,
  useFileUploadLimits,
  validateFileUpload,
} from '@/hooks/use-file-upload-limits';
import { cn } from '@/lib/utils';

interface FileUploadItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  preview?: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface FileUploadPreviewProps {
  files: FileUploadItem[];
  onRemove?: (fileId: string) => void;
  onUpload?: (files: File[]) => void;
  onPreview?: (file: FileUploadItem) => void;
  maxFiles?: number;
  maxSize?: number; // in MB - will be overridden by tier limits
  acceptedTypes?: string[];
  variant?: 'grid' | 'list' | 'compact';
  className?: string;
  showUpgradePrompt?: boolean; // Show tier upgrade messaging
}

const fileTypeIcons: Record<string, React.ComponentType<any>> = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  text: FileText,
  code: FileCode,
  archive: FileArchive,
  spreadsheet: FileSpreadsheet,
  default: File,
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) {
    return fileTypeIcons.image;
  }
  if (type.startsWith('video/')) {
    return fileTypeIcons.video;
  }
  if (type.startsWith('audio/')) {
    return fileTypeIcons.audio;
  }
  if (type.startsWith('text/')) {
    return fileTypeIcons.text;
  }
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) {
    return fileTypeIcons.archive;
  }
  if (type.includes('sheet') || type.includes('excel')) {
    return fileTypeIcons.spreadsheet;
  }
  if (
    type.includes('javascript') ||
    type.includes('typescript') ||
    type.includes('python')
  ) {
    return fileTypeIcons.code;
  }
  return fileTypeIcons.default;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
};

export function FileUploadPreview({
  files,
  onRemove,
  onUpload,
  onPreview,
  maxFiles = 10,
  maxSize = 10, // 10MB default - overridden by tier limits
  acceptedTypes,
  variant = 'grid',
  className,
  showUpgradePrompt = true,
}: FileUploadPreviewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { subscription } = useAuthContext();
  const uploadLimits = useFileUploadLimits();

  // Use tier-based limits instead of props
  const effectiveMaxSize = Math.round(uploadLimits.maxFileSize / (1024 * 1024)); // Convert to MB
  const effectiveMaxFiles = Math.min(maxFiles, uploadLimits.maxFiles);

  const tierRecommendations = getUploadRecommendations(
    subscription?.tier || 'free'
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFiles = useCallback(
    (newFiles: File[]) => {
      // Check if user can upload files at all
      if (!uploadLimits.canUpload) {
        if (uploadLimits.error) {
          toast.error(uploadLimits.error);
        }
        if (
          showUpgradePrompt &&
          subscription &&
          subscription.tier !== 'pro' &&
          subscription.tier !== 'pro_plus' &&
          subscription.tier !== 'admin'
        ) {
          setShowUpgrade(true);
        }
        return;
      }

      // Validate file count
      if (files.length + newFiles.length > effectiveMaxFiles) {
        toast.error(
          `Maximum ${effectiveMaxFiles} files allowed for your ${subscription?.tier?.toUpperCase()} tier`
        );
        return;
      }

      // Validate each file against tier limits
      const validFiles = newFiles.filter((file) => {
        const validation = validateFileUpload(file, uploadLimits);
        if (!validation.valid) {
          toast.error(validation.error);
          return false;
        }

        // Check file type if specified
        if (
          acceptedTypes &&
          !acceptedTypes.some((type) => file.type.match(type))
        ) {
          toast.error(`${file.name} is not an accepted file type`);
          return false;
        }

        return true;
      });

      if (validFiles.length > 0 && onUpload) {
        onUpload(validFiles);
      }
    },
    [
      files.length,
      effectiveMaxFiles,
      acceptedTypes,
      onUpload,
      uploadLimits,
      subscription?.tier,
      showUpgradePrompt,
    ]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFiles(droppedFiles);
    },
    [handleFiles]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  if (files.length === 0) {
    // Free tier cannot upload files - show upgrade prompt
    if (subscription?.tier === 'free') {
      return (
        <>
          <div
            className={cn(
              'relative rounded-lg border-2 border-muted-foreground/25 border-dashed bg-muted/10 p-8 text-center',
              className
            )}
          >
            <Crown className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-medium text-lg text-muted-foreground">
              {tierRecommendations.title}
            </h3>
            <p className="mt-2 text-muted-foreground text-sm">
              {tierRecommendations.description}
            </p>

            <Button className="mt-4" onClick={() => setShowUpgrade(true)}>
              <Crown className="mr-2 h-4 w-4" />
              {tierRecommendations.action}
            </Button>
          </div>

          {showUpgrade && (
            <UpgradePrompt
              onDismiss={() => setShowUpgrade(false)}
              prompt={{
                shouldShow: true,
                title: 'Upgrade to Upload Files',
                message:
                  'Upload documents, images, and more to enhance your AI conversations. Pro tier includes 1MB file uploads.',
                suggestedTier: 'pro',
                urgency: 'medium',
              }}
              variant="modal"
            />
          )}
        </>
      );
    }

    return (
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25',
          uploadLimits.canUpload ? '' : 'pointer-events-none opacity-50',
          className
        )}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          accept={acceptedTypes?.join(',')}
          className="hidden"
          disabled={!uploadLimits.canUpload}
          multiple
          onChange={handleFileSelect}
          ref={fileInputRef}
          type="file"
        />

        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 font-medium text-lg">
          Drop files here or click to browse
        </h3>

        {/* Tier-based messaging */}
        <div className="mt-2 space-y-1">
          <p className="text-muted-foreground text-sm">
            <Badge className="mr-2" variant="secondary">
              {subscription?.tier?.toUpperCase() || 'FREE'}
            </Badge>
            Up to {effectiveMaxSize}MB per file, {effectiveMaxFiles} files max
          </p>

          {uploadLimits.storageLimit > 0 && (
            <p className="text-muted-foreground text-xs">
              Storage: {formatFileSize(uploadLimits.storageUsed)} /{' '}
              {formatFileSize(uploadLimits.storageLimit)} used
              {uploadLimits.filesThisMonth > 0 && (
                <span className="ml-2">
                  • Files this month: {uploadLimits.filesThisMonth} /{' '}
                  {uploadLimits.filesLimit}
                </span>
              )}
            </p>
          )}

          {uploadLimits.error && (
            <p className="text-destructive text-xs">{uploadLimits.error}</p>
          )}
        </div>

        {acceptedTypes && (
          <p className="mt-2 text-muted-foreground text-xs">
            Accepted: {acceptedTypes.join(', ')}
          </p>
        )}

        <Button
          className="mt-4"
          disabled={
            !!uploadLimits.error &&
            !!subscription &&
            (subscription.tier === 'pro' ||
              subscription.tier === 'pro_plus' ||
              subscription.tier === 'admin')
          }
          onClick={() => {
            if (
              !uploadLimits.canUpload &&
              subscription &&
              subscription.tier !== 'pro' && subscription.tier !== 'pro_plus' &&
              subscription.tier !== 'admin'
            ) {
              setShowUpgrade(true);
            } else {
              fileInputRef.current?.click();
            }
          }}
          variant="outline"
        >
          <Paperclip className="mr-2 h-4 w-4" />
          Select Files
        </Button>

        {/* Upgrade suggestion for Pro users */}
        {subscription?.tier === 'pro' && tierRecommendations.action && (
          <Button
            className="mt-2"
            onClick={() => setShowUpgrade(true)}
            size="sm"
            variant="ghost"
          >
            <Crown className="mr-2 h-3 w-3" />
            {tierRecommendations.action}
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-2', className)}>
        <AnimatePresence>
          {files.map((file) => {
            const Icon = getFileIcon(file.type);
            return (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
                exit={{ opacity: 0, x: 20 }}
                initial={{ opacity: 0, x: -20 }}
                key={file.id}
              >
                <Icon className="h-8 w-8 shrink-0 text-muted-foreground" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-sm">{file.name}</p>
                    {file.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {formatFileSize(file.size)}
                  </p>
                  {file.status === 'uploading' &&
                    file.progress !== undefined && (
                      <Progress className="mt-1 h-1" value={file.progress} />
                    )}
                  {file.error && (
                    <p className="mt-1 text-destructive text-xs">
                      {file.error}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {file.preview && onPreview && (
                    <Button
                      className="h-8 w-8"
                      onClick={() => onPreview(file)}
                      size="icon"
                      variant="ghost"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {file.url && (
                    <Button
                      asChild
                      className="h-8 w-8"
                      size="icon"
                      variant="ghost"
                    >
                      <a download={file.name} href={file.url}>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {onRemove && file.status !== 'uploading' && (
                    <Button
                      className="h-8 w-8 hover:text-destructive"
                      onClick={() => onRemove(file.id)}
                      size="icon"
                      variant="ghost"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {file.status === 'uploading' && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {files.length < effectiveMaxFiles && uploadLimits.canUpload && (
          <Button
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
          >
            <Upload className="mr-2 h-4 w-4" />
            Add More Files
          </Button>
        )}
        <input
          accept={acceptedTypes?.join(',')}
          className="hidden"
          disabled={!uploadLimits.canUpload}
          multiple
          onChange={handleFileSelect}
          ref={fileInputRef}
          type="file"
        />

        {showUpgrade && (
          <UpgradePrompt
            onDismiss={() => setShowUpgrade(false)}
            prompt={{
              shouldShow: true,
              title:
                subscription?.tier === 'free'
                  ? 'Upgrade to Upload Files'
                  : `Upgrade to ${subscription?.tier === 'pro' ? 'Pro+' : 'Pro'}`,
              message:
                subscription?.tier === 'free'
                  ? 'Upload documents, images, and more to enhance your AI conversations. Pro tier includes 1MB file uploads.'
                  : subscription?.tier === 'pro'
                    ? 'Pro+ tier includes 5MB file uploads and 1GB storage for larger documents.'
                    : 'Upgrade for enhanced file upload capabilities.',
              suggestedTier: subscription?.tier === 'free' ? 'pro' : 'pro_plus',
              urgency: 'medium',
            }}
            variant="modal"
          />
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        <AnimatePresence>
          {files.map((file) => (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              initial={{ opacity: 0, scale: 0.8 }}
              key={file.id}
            >
              <Badge className="pr-1" variant="secondary">
                <Paperclip className="mr-1 h-3 w-3" />
                <span className="max-w-[100px] truncate">{file.name}</span>
                {onRemove && (
                  <Button
                    className="ml-1 h-4 w-4 hover:bg-destructive/20"
                    onClick={() => onRemove(file.id)}
                    size="icon"
                    variant="ghost"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </Badge>
            </motion.div>
          ))}
        </AnimatePresence>

        {files.length < effectiveMaxFiles && uploadLimits.canUpload && (
          <>
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              variant="outline"
            >
              <Upload className="h-3 w-3" />
            </Button>
            <input
              accept={acceptedTypes?.join(',')}
              className="hidden"
              disabled={!uploadLimits.canUpload}
              multiple
              onChange={handleFileSelect}
              ref={fileInputRef}
              type="file"
            />
          </>
        )}
      </div>
    );
  }

  // Grid variant (default)
  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence>
          {files.map((file) => {
            const Icon = getFileIcon(file.type);
            const isImage = file.type.startsWith('image/');

            return (
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                initial={{ opacity: 0, scale: 0.9 }}
                key={file.id}
              >
                <Card className="group relative overflow-hidden">
                  <div className="relative aspect-square">
                    {isImage && file.preview ? (
                      <img
                        alt={file.name}
                        className="h-full w-full object-cover"
                        src={file.preview}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Icon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}

                    {file.status === 'uploading' &&
                      file.progress !== undefined && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                          <div className="text-center">
                            <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
                            <p className="text-sm">{file.progress}%</p>
                          </div>
                        </div>
                      )}

                    {file.status === 'error' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
                        <AlertCircle className="h-8 w-8 text-destructive" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="absolute right-2 bottom-2 left-2">
                        <p className="truncate text-white text-xs">
                          {file.name}
                        </p>
                        <p className="text-white/80 text-xs">
                          {formatFileSize(file.size)}
                        </p>
                      </div>

                      <div className="absolute top-2 right-2 flex gap-1">
                        {file.preview && onPreview && (
                          <Button
                            className="h-7 w-7"
                            onClick={() => onPreview(file)}
                            size="icon"
                            variant="secondary"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {onRemove && file.status !== 'uploading' && (
                          <Button
                            className="h-7 w-7"
                            onClick={() => onRemove(file.id)}
                            size="icon"
                            variant="secondary"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {file.status === 'completed' && (
                      <div className="absolute top-2 left-2">
                        <CheckCircle className="h-5 w-5 text-green-500 drop-shadow" />
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {files.length < effectiveMaxFiles && uploadLimits.canUpload && (
          <motion.div animate={{ opacity: 1 }} initial={{ opacity: 0 }}>
            <Card
              className={cn(
                'flex aspect-square cursor-pointer items-center justify-center border-dashed transition-colors hover:bg-muted/50',
                !uploadLimits.canUpload && 'cursor-not-allowed opacity-50'
              )}
              onClick={() => {
                if (uploadLimits.canUpload) {
                  fileInputRef.current?.click();
                } else if (subscription?.tier === 'free') {
                  setShowUpgrade(true);
                }
              }}
            >
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground text-sm">
                  {uploadLimits.canUpload ? 'Add File' : 'Upgrade to Upload'}
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Show upgrade prompt for free tier when no uploads allowed */}
        {!uploadLimits.canUpload &&
          subscription?.tier === 'free' &&
          files.length === 0 && (
            <motion.div animate={{ opacity: 1 }} initial={{ opacity: 0 }}>
              <Card className="flex aspect-square items-center justify-center border-amber-300 border-dashed bg-amber-50/50 dark:bg-amber-950/20">
                <div className="text-center">
                  <Crown className="mx-auto h-8 w-8 text-amber-600 dark:text-amber-400" />
                  <p className="mt-2 text-amber-700 text-sm dark:text-amber-300">
                    Upgrade to Pro
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
      </div>

      <input
        accept={acceptedTypes?.join(',')}
        className="hidden"
        disabled={!uploadLimits.canUpload}
        multiple
        onChange={handleFileSelect}
        ref={fileInputRef}
        type="file"
      />

      {showUpgrade && (
        <UpgradePrompt
          onDismiss={() => setShowUpgrade(false)}
          prompt={{
            shouldShow: true,
            title:
              subscription?.tier === 'free'
                ? 'Upgrade to Upload Files'
                : `Upgrade to ${subscription?.tier === 'pro' ? 'Pro+' : 'Pro'}`,
            message:
              subscription?.tier === 'free'
                ? 'Upload documents, images, and more to enhance your AI conversations. Pro tier includes 1MB file uploads.'
                : subscription?.tier === 'pro'
                  ? 'Pro+ tier includes 5MB file uploads and 1GB storage for larger documents.'
                  : 'Upgrade for enhanced file upload capabilities.',
            suggestedTier: subscription?.tier === 'free' ? 'pro' : 'pro_plus',
            urgency: 'medium',
          }}
          variant="modal"
        />
      )}
    </div>
  );
}

export default FileUploadPreview;

'use client';

import { api } from '@convex/_generated/api';
import { useAction, useMutation } from 'convex/react';
import {
  Edit2,
  ExternalLink,
  Eye,
  MoreVertical,
  Star,
  StarOff,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Memory, MemoryType, UpdateMemoryData } from '@/lib/types/memory';
import {
  formatImportanceScore,
  formatRelativeTime,
  getImportanceColor,
  getImportanceStars,
  getMemoryTypeConfig,
  memoryTypeConfigs,
} from '@/lib/types/memory';
import { cn } from '@/lib/utils';

interface MemoryCardProps {
  memory: Memory;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

export function MemoryCard({
  memory,
  onEdit,
  onDelete,
  onView,
}: MemoryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editData, setEditData] = useState<UpdateMemoryData>({
    content: memory.content,
    type: memory.type,
    importance: memory.importance,
    tags: memory.tags || [],
  });

  // Mutations
  const updateMemory = useMutation(api.memories.update);
  const deleteMemory = useMutation(api.memories.remove);
  const updateAccess = useMutation(api.memories.updateAccess);
  const regenerateEmbedding = useAction(api.embeddings.generateMemoryEmbedding);

  const typeConfig = getMemoryTypeConfig(memory.type);
  const importanceStars = getImportanceStars(memory.importance);
  const importanceColor = getImportanceColor(memory.importance);

  const handleEdit = () => {
    setIsEditing(true);
    onEdit?.();
  };

  const handleSaveEdit = async () => {
    try {
      await updateMemory({
        id: memory._id,
        updates: editData,
      });
      // Regenerate embedding after content changes to keep RAG accurate
      if (editData.content && editData.content !== memory.content) {
        await regenerateEmbedding({
          memoryId: memory._id,
          content: editData.content,
        });
      }
      setIsEditing(false);
      toast.success('Memory updated successfully');
    } catch (_error) {
      toast.error('Failed to update memory');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      content: memory.content,
      type: memory.type,
      importance: memory.importance,
      tags: memory.tags || [],
    });
  };

  const handleDelete = async () => {
    try {
      await deleteMemory({ id: memory._id });
      setShowDeleteDialog(false);
      toast.success('Memory deleted successfully');
      onDelete?.();
    } catch (_error) {
      toast.error('Failed to delete memory');
    }
  };

  const handleView = async () => {
    try {
      await updateAccess({ id: memory._id });
      onView?.();
    } catch (_error) {}
  };

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    setEditData({ ...editData, tags });
  };

  if (isEditing) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{typeConfig.icon}</span>
              <Select
                onValueChange={(value) =>
                  setEditData({ ...editData, type: value as MemoryType })
                }
                value={editData.type}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(memoryTypeConfigs).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSaveEdit} size="sm">
                Save
              </Button>
              <Button onClick={handleCancelEdit} size="sm" variant="ghost">
                Cancel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              className="mt-1"
              id="content"
              onChange={(e) =>
                setEditData({ ...editData, content: e.target.value })
              }
              placeholder="Enter memory content..."
              rows={4}
              value={editData.content}
            />
          </div>
          <div>
            <Label htmlFor="importance">
              Importance Score (
              {formatImportanceScore(editData.importance || 0.5)})
            </Label>
            <Input
              className="mt-1"
              id="importance"
              max="1"
              min="0"
              onChange={(e) =>
                setEditData({
                  ...editData,
                  importance: Number.parseFloat(e.target.value),
                })
              }
              step="0.1"
              type="range"
              value={editData.importance || 0.5}
            />
          </div>
          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              className="mt-1"
              id="tags"
              onChange={(e) => handleTagsChange(e.target.value)}
              placeholder="tag1, tag2, tag3"
              value={editData.tags?.join(', ') || ''}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card
        className={cn(
          'group relative transition-all duration-200 hover:shadow-md',
          'border-l-4',
          typeConfig.borderColor,
          typeConfig.bgColor
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="text-lg">{typeConfig.icon}</span>
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate font-medium text-sm">
                  {typeConfig.label}
                </CardTitle>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    className={cn('px-2 py-0.5 text-xs', typeConfig.color)}
                    variant="secondary"
                  >
                    {memory.type}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i}>
                        {i < importanceStars ? (
                          <Star
                            className={cn(
                              'h-3 w-3 fill-current',
                              importanceColor
                            )}
                          />
                        ) : (
                          <StarOff className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                    <span className={cn('ml-1 text-xs', importanceColor)}>
                      {formatImportanceScore(memory.importance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="h-8 w-8 p-0 opacity-60 transition-opacity group-hover:opacity-100"
                  size="sm"
                  variant="ghost"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleView}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {memory.sourceId && (
                  <DropdownMenuItem>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Go to Source
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="line-clamp-3 text-sm leading-relaxed">
            {memory.content}
          </CardDescription>

          {/* Tags */}
          {memory.tags && memory.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {memory.tags.map((tag) => (
                <Badge
                  className="px-2 py-0.5 text-xs"
                  key={tag}
                  variant="outline"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between border-border/50 border-t pt-3">
            <div className="flex items-center gap-4 text-muted-foreground text-xs">
              <span>Created {formatRelativeTime(memory.createdAt)}</span>
              {memory.lastAccessed && (
                <span>Accessed {formatRelativeTime(memory.lastAccessed)}</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Eye className="h-3 w-3" />
              <span>{memory.accessCount} views</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Memory</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this memory? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

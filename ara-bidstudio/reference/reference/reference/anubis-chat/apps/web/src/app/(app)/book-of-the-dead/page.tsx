'use client';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminGuard } from '@/components/auth/adminGuard';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ExplorerPanel } from './explorerPanel';
import { PromptFormPanel } from './promptFormPanel';
import type { FolderNode, PromptNode } from './types';

export default function BookOfTheDeadPage() {
  const router = useRouter();
  const { subscription } = useAuthContext();
  const isProPlus = subscription?.tier === 'pro_plus';
  const gated = !isProPlus;

  // Data
  const folderHierarchy = useQuery(api.prompts.getFolderHierarchy, {});
  const allPrompts = useQuery(api.prompts.listPrompts, { limit: 1000 });

  // Mutations
  const createFolder = useMutation(api.prompts.createFolder);
  const updateFolder = useMutation(api.prompts.updateFolder);
  const deleteFolder = useMutation(api.prompts.deleteFolder);
  const savePrompt = useMutation(api.prompts.savePrompt);
  const deletePrompt = useMutation(api.prompts.deletePrompt);
  const updatePrompt = useMutation(api.prompts.updatePrompt);
  const recordUsage = useMutation(api.prompts.recordUsage);
  const movePrompt = useMutation(api.prompts.movePrompt);

  // UI State
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedFolderId, setSelectedFolderId] = useState<
    Id<'promptFolders'> | undefined
  >();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [editingPromptId, setEditingPromptId] = useState<Id<'prompts'> | null>(
    null
  );
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [newFolderName, setNewFolderName] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleToggleFolder = (folderId: Id<'promptFolders'>) => {
    setExpanded((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleCopyPrompt = async (content: string, id: Id<'prompts'>) => {
    try {
      await navigator.clipboard.writeText(content);
      await recordUsage({ id });
      toast.success('Prompt copied to clipboard!');
    } catch (_error) {
      toast.error('Failed to copy prompt');
    }
  };

  const handleSelectPromptForEdit = (prompt: PromptNode) => {
    setEditingPromptId(prompt._id);
    setFormTitle(prompt.title);
    setFormContent(prompt.content);
  };

  const handleDeletePrompt = async (id: Id<'prompts'>) => {
    try {
      await deletePrompt({ id });
      toast.success('Prompt deleted');
    } catch (_error) {
      toast.error('Failed to delete prompt');
    }
  };

  const handleDeleteFolder = async (id: Id<'promptFolders'>) => {
    try {
      await deleteFolder({ id });
      toast.success('Folder deleted');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete folder';
      toast.error(message);
    }
  };

  const handleRenameFolder = async (
    id: Id<'promptFolders'>,
    currentName: string
  ) => {
    const name = window.prompt('Rename folder', currentName)?.trim();
    if (!name || name === currentName) {
      return;
    }
    try {
      await updateFolder({ id, name });
      toast.success('Folder renamed');
    } catch (_error) {
      toast.error('Failed to rename folder');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      return;
    }
    try {
      await createFolder({
        name: newFolderName,
        parentId: selectedFolderId,
      });
      setNewFolderName('');
      toast.success('Folder created');
    } catch (_error) {
      toast.error('Failed to create folder');
    }
  };

  const handleSavePrompt = async () => {
    if (!(formTitle.trim() && formContent.trim())) {
      toast.error('Please enter both title and content');
      return;
    }
    try {
      if (editingPromptId) {
        await updatePrompt({
          id: editingPromptId as Id<'prompts'>,
          title: formTitle,
          content: formContent,
        });
        toast.success('Prompt updated');
      } else {
        await savePrompt({
          title: formTitle,
          content: formContent,
          folderId: selectedFolderId,
        });
        toast.success('Prompt saved');
      }
      setEditingPromptId(null);
      setFormTitle('');
      setFormContent('');
    } catch (_error) {
      toast.error('Failed to save prompt');
    }
  };

  const handleEditPrompt = async (id: Id<'prompts'>) => {
    const prompt = (allPrompts || []).find((p: PromptNode) => p._id === id);
    const newTitle = window.prompt('Edit title', prompt?.title ?? '')?.trim();
    if (!newTitle) {
      return;
    }
    const newContent = window
      .prompt('Edit content', prompt?.content ?? '')
      ?.trim();
    if (newContent === undefined) {
      return;
    }
    try {
      await updatePrompt({ id, title: newTitle, content: newContent });
      toast.success('Prompt updated');
    } catch (_error) {
      toast.error('Failed to update prompt');
    }
  };

  const handleMovePromptToFolder = async (id: Id<'prompts'>) => {
    try {
      await movePrompt({ promptId: id, targetFolderId: selectedFolderId });
      toast.success('Prompt moved');
    } catch (_error) {
      toast.error('Failed to move prompt');
    }
  };

  const handleMovePromptToRoot = async (id: Id<'prompts'>) => {
    try {
      await movePrompt({ promptId: id });
      toast.success('Prompt moved to root');
    } catch (_error) {
      toast.error('Failed to move prompt');
    }
  };

  return (
    <AdminGuard>
      <div className="h-full w-full bg-gradient-to-b from-primary/5 dark:from-primary/10">
        {/* Header strip matching app pages */}
        <div className="w-full border-border/50 border-b bg-card/30 px-3 py-3 backdrop-blur sm:px-4 md:px-6">
          <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between">
            <div>
              <h1 className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text font-semibold text-2xl text-transparent sm:text-3xl">
                Prompt Library
              </h1>
              <p className="text-muted-foreground">
                Your personal prompt library with IDE-style organization
              </p>
            </div>
            {gated && (
              <Button
                onClick={() => router.push('/subscription')}
                variant="outline"
              >
                <Lock className="mr-2 h-4 w-4" /> Upgrade to Pro+
              </Button>
            )}
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1600px] p-3 sm:p-4 md:p-6">
          <div
            aria-disabled={gated}
            className={cn(
              'relative grid gap-4 md:grid-cols-[320px,1fr] lg:grid-cols-[360px,1fr] xl:grid-cols-[400px,1fr]',
              gated && 'pointer-events-none opacity-60'
            )}
          >
            {/* Left: IDE-style File Explorer */}
            <div className="space-y-4">
              <ExplorerPanel
                allPrompts={(allPrompts || []) as PromptNode[]}
                debouncedQuery={debouncedQuery}
                expanded={expanded}
                folderHierarchy={(folderHierarchy || []) as FolderNode[]}
                newFolderName={newFolderName}
                onCopyPrompt={handleCopyPrompt}
                onCreateFolder={handleCreateFolder}
                onDeleteFolder={handleDeleteFolder}
                onDeletePrompt={handleDeletePrompt}
                onEditPrompt={handleEditPrompt}
                onMovePromptToFolder={
                  selectedFolderId ? handleMovePromptToFolder : undefined
                }
                onMovePromptToRoot={handleMovePromptToRoot}
                onRenameFolder={handleRenameFolder}
                onSelectFolder={setSelectedFolderId}
                onSelectPromptForEdit={handleSelectPromptForEdit}
                onToggleFolder={handleToggleFolder}
                searchQuery={searchQuery}
                selectedFolderId={selectedFolderId}
                setNewFolderName={setNewFolderName}
                setSearchQuery={setSearchQuery}
              />
            </div>

            {/* Right column: create/edit form (sticky) */}
            <PromptFormPanel
              editingPromptId={editingPromptId}
              formContent={formContent}
              formTitle={formTitle}
              onCancel={() => {
                setEditingPromptId(null);
                setFormTitle('');
                setFormContent('');
              }}
              onSave={handleSavePrompt}
              selectedFolderId={selectedFolderId}
              setFormContent={setFormContent}
              setFormTitle={setFormTitle}
            />

            {gated && (
              <div className="pointer-events-none absolute inset-0 rounded-md" />
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}

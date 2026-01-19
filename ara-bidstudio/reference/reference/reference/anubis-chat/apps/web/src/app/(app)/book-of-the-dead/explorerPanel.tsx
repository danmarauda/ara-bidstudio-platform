'use client';

import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  File,
  Folder,
  FolderOpen,
  FolderPlus,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import type { JSX } from 'react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { FolderNode, PromptNode } from './types';

function buildHeaderLabel(args: {
  debouncedQuery: string;
  visibleLength: number;
  selectedFolderId?: Id<'promptFolders'>;
  folderHierarchy?: FolderNode[] | null;
}): JSX.Element {
  const { debouncedQuery, visibleLength, selectedFolderId, folderHierarchy } =
    args;
  if (debouncedQuery) {
    return <span>Search Results ({visibleLength})</span>;
  }
  if (selectedFolderId) {
    const name = folderHierarchy?.find((f) => f._id === selectedFolderId)?.name;
    return <span>Folder: {name || 'Unknown'}</span>;
  }
  return <span>All Prompts ({visibleLength})</span>;
}

type PromptListItemProps = {
  prompt: PromptNode;
  onSelect: (prompt: PromptNode) => void;
  onCopy: (content: string, id: Id<'prompts'>) => void;
  onDelete: (id: Id<'prompts'>) => void;
};

function PromptListItem({
  prompt,
  onSelect,
  onCopy,
  onDelete,
}: PromptListItemProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <button
          className="group grid grid-cols-[1fr_auto] items-start gap-3 p-3 text-left hover:bg-accent/50"
          onClick={() => onSelect(prompt)}
          type="button"
        >
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <File className="h-4 w-4 flex-shrink-0 text-amber-500" />
              <span className="truncate font-medium">{prompt.title}</span>
              {prompt.usageCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  <Star className="h-3 w-3" /> {prompt.usageCount}
                </span>
              )}
            </div>
            <div className="line-clamp-3 text-muted-foreground text-sm">
              {prompt.content}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <Button
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onCopy(prompt.content, prompt._id);
              }}
              size="sm"
              variant="ghost"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(prompt._id);
              }}
              size="sm"
              variant="ghost"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onDelete(prompt._id)}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete Prompt
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onSelect(prompt)}>
          Edit Prompt
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function TopPromptButton({
  title,
  content,
  usageCount,
  id,
  onCopy,
}: {
  title: string;
  content: string;
  usageCount: number;
  id: Id<'prompts'>;
  onCopy: (content: string, id: Id<'prompts'>) => void;
}) {
  return (
    <button
      className="group grid grid-cols-[1fr_auto] items-center gap-2 rounded-sm border bg-card/50 px-2 py-1 text-left hover:bg-accent/50"
      onClick={() => onCopy(content, id)}
      type="button"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-xs">{title}</div>
        <div className="line-clamp-1 text-[11px] text-muted-foreground">
          {content}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
          {usageCount}
        </span>
        <Button
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
          size="sm"
          variant="ghost"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </button>
  );
}

function renderFolderTree(args: {
  folders: FolderNode[];
  prompts: PromptNode[];
  expanded: Record<string, boolean>;
  selectedFolderId?: Id<'promptFolders'>;
  onToggleFolder: (folderId: Id<'promptFolders'>) => void;
  onSelectFolder: (folderId: Id<'promptFolders'> | undefined) => void;
  onSelectPromptForEdit: (prompt: PromptNode) => void;
  onDeletePrompt: (id: Id<'prompts'>) => void;
  onDeleteFolder: (id: Id<'promptFolders'>) => void;
  onRenameFolder?: (id: Id<'promptFolders'>, currentName: string) => void;
  onEditPrompt?: (id: Id<'prompts'>) => void;
  onMovePromptToFolder?: (promptId: Id<'prompts'>) => void;
  onMovePromptToRoot?: (promptId: Id<'prompts'>) => void;
  level?: number;
}) {
  const {
    folders,
    prompts,
    expanded,
    selectedFolderId,
    onToggleFolder,
    onSelectFolder,
    onSelectPromptForEdit,
    onDeletePrompt,
    onDeleteFolder,
    onRenameFolder,
    onEditPrompt,
    onMovePromptToFolder,
    onMovePromptToRoot,
    level = 0,
  } = args;

  return (
    <div className="text-sm">
      {folders.map((folder) => {
        const isExpanded = expanded[folder._id];
        const isSelected = selectedFolderId === folder._id;
        const folderPrompts = prompts.filter((p) => p.folderId === folder._id);

        return (
          <div key={folder._id}>
            <ContextMenu>
              <ContextMenuTrigger>
                <div
                  className={cn(
                    'flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1 hover:bg-accent hover:text-accent-foreground',
                    isSelected && 'bg-accent text-accent-foreground'
                  )}
                  style={{ paddingLeft: `${8 + level * 16}px` }}
                >
                  <button
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      onToggleFolder(folder._id);
                      onSelectFolder(folder._id);
                    }}
                    type="button"
                  >
                    <div className="flex items-center gap-1">
                      {folder.children &&
                        folder.children.length > 0 &&
                        (isExpanded ? (
                          <ChevronDown className="h-4 w-4 opacity-70" />
                        ) : (
                          <ChevronRight className="h-4 w-4 opacity-70" />
                        ))}
                      {isExpanded ? (
                        <FolderOpen className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Folder className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <span className="flex-1 truncate">{folder.name}</span>
                    {folderPrompts.length > 0 && (
                      <span className="text-muted-foreground text-xs">
                        {folderPrompts.length}
                      </span>
                    )}
                  </button>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                {onRenameFolder && (
                  <ContextMenuItem
                    onClick={() => onRenameFolder(folder._id, folder.name)}
                  >
                    Rename Folder
                  </ContextMenuItem>
                )}
                <ContextMenuItem onClick={() => onDeleteFolder(folder._id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Folder
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>

            {isExpanded &&
              folder.children &&
              renderFolderTree({
                folders: folder.children,
                prompts,
                expanded,
                selectedFolderId,
                onToggleFolder,
                onSelectFolder,
                onSelectPromptForEdit,
                onDeletePrompt,
                onDeleteFolder,
                onRenameFolder,
                onEditPrompt,
                onMovePromptToFolder,
                onMovePromptToRoot,
                level: level + 1,
              })}

            {isExpanded &&
              folderPrompts.map((prompt) => (
                <ContextMenu key={prompt._id}>
                  <ContextMenuTrigger>
                    <button
                      className="group flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1 text-left hover:bg-accent hover:text-accent-foreground"
                      onClick={() => onSelectPromptForEdit(prompt)}
                      style={{ paddingLeft: `${24 + (level + 1) * 16}px` }}
                      type="button"
                    >
                      <File className="h-4 w-4 flex-shrink-0 text-amber-500" />
                      <span className="flex-1 truncate">{prompt.title}</span>
                      {prompt.usageCount > 0 && (
                        <span className="text-muted-foreground text-xs">
                          {prompt.usageCount}
                        </span>
                      )}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <Button
                          className="h-6 w-6 p-0"
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      onClick={() => onSelectPromptForEdit(prompt)}
                    >
                      Edit Prompt
                    </ContextMenuItem>
                    {onMovePromptToFolder && (
                      <ContextMenuItem
                        onClick={() => onMovePromptToFolder(prompt._id)}
                      >
                        Move to Selected Folder
                      </ContextMenuItem>
                    )}
                    {onMovePromptToRoot && (
                      <ContextMenuItem
                        onClick={() => onMovePromptToRoot(prompt._id)}
                      >
                        Move to Root
                      </ContextMenuItem>
                    )}
                    <ContextMenuItem onClick={() => onDeletePrompt(prompt._id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Prompt
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
          </div>
        );
      })}

      {/* Root level prompts */}
      {level === 0 &&
        prompts
          .filter((p) => !p.folderId)
          .map((prompt) => (
            <ContextMenu key={prompt._id}>
              <ContextMenuTrigger>
                <button
                  className="group flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1 text-left hover:bg-accent hover:text-accent-foreground"
                  onClick={() => onSelectPromptForEdit(prompt)}
                  style={{ paddingLeft: '8px' }}
                  type="button"
                >
                  <File className="h-4 w-4 flex-shrink-0 text-amber-500" />
                  <span className="flex-1 truncate">{prompt.title}</span>
                  {prompt.usageCount > 0 && (
                    <span className="text-muted-foreground text-xs">
                      {prompt.usageCount}
                    </span>
                  )}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <Button
                      className="h-6 w-6 p-0"
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </button>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => onSelectPromptForEdit(prompt)}>
                  Edit Prompt
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onDeletePrompt(prompt._id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Prompt
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
    </div>
  );
}

export function ExplorerPanel(props: {
  folderHierarchy?: FolderNode[] | null;
  allPrompts?: PromptNode[] | null;
  topLimit?: number;
  expanded: Record<string, boolean>;
  selectedFolderId?: Id<'promptFolders'>;
  onToggleFolder: (folderId: Id<'promptFolders'>) => void;
  onSelectFolder: (folderId: Id<'promptFolders'> | undefined) => void;
  onSelectPromptForEdit: (prompt: PromptNode) => void;
  onDeletePrompt: (id: Id<'prompts'>) => void;
  onDeleteFolder: (id: Id<'promptFolders'>) => void;
  onRenameFolder: (id: Id<'promptFolders'>, currentName: string) => void;
  onEditPrompt: (id: Id<'prompts'>) => void;
  onMovePromptToFolder?: (promptId: Id<'prompts'>) => void;
  onMovePromptToRoot: (promptId: Id<'prompts'>) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  debouncedQuery: string;
  newFolderName: string;
  setNewFolderName: (value: string) => void;
  onCreateFolder: () => void;
  onCopyPrompt: (content: string, id: Id<'prompts'>) => Promise<void> | void;
}) {
  const {
    folderHierarchy,
    allPrompts,
    topLimit = 5,
    expanded,
    selectedFolderId,
    onToggleFolder,
    onSelectFolder,
    onSelectPromptForEdit,
    onDeletePrompt,
    onDeleteFolder,
    onRenameFolder,
    onEditPrompt,
    onMovePromptToFolder,
    onMovePromptToRoot,
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    newFolderName,
    setNewFolderName,
    onCreateFolder,
    onCopyPrompt,
  } = props;

  const searchedPrompts = useQuery(api.prompts.listPrompts, {
    search: debouncedQuery || undefined,
    limit: 100,
  });
  const topPrompts = useQuery(api.prompts.getTopPrompts, { limit: topLimit });

  const visiblePrompts = useMemo(() => {
    return debouncedQuery ? searchedPrompts || [] : allPrompts || [];
  }, [debouncedQuery, searchedPrompts, allPrompts]);

  return (
    <Card className="flex h-[calc(100vh-200px)] flex-col border-sidebar-border/60 bg-card/60">
      <div className="flex items-center justify-between border-b bg-card/50 px-3 py-2">
        <div className="flex items-center gap-2 font-medium text-sm">
          <Folder className="h-4 w-4" />
          File Explorer
        </div>
        <div className="flex items-center gap-1">
          <Input
            className="h-7 w-24 text-xs"
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onCreateFolder();
              }
            }}
            placeholder="New folder"
            value={newFolderName}
          />
          <Button
            className="h-7 w-7 p-0"
            onClick={onCreateFolder}
            size="sm"
            variant="ghost"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="border-b p-2">
        <div className="relative">
          <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 opacity-50" />
          <Input
            className="h-7 pl-7 text-xs"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompts..."
            value={searchQuery}
          />
        </div>
      </div>

      {/* Explorer content */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid gap-3 md:grid-cols-[1fr,360px] lg:grid-cols-[1fr,400px]">
          {/* Left column: tree + prompts + most used */}
          <div className="space-y-3">
            <div className="space-y-1">
              {/* "All Prompts" Root Option */}
              <button
                className={cn(
                  'flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground',
                  !selectedFolderId && 'bg-accent text-accent-foreground'
                )}
                onClick={() => onSelectFolder(undefined)}
                type="button"
              >
                <Folder className="h-4 w-4 text-blue-500" />
                <span className="flex-1">All Prompts</span>
                <span className="text-muted-foreground text-xs">
                  {visiblePrompts?.filter((p: PromptNode) => !p.folderId)
                    .length || 0}
                </span>
              </button>

              {folderHierarchy &&
                renderFolderTree({
                  folders: folderHierarchy as FolderNode[],
                  prompts: (visiblePrompts || []) as PromptNode[],
                  expanded,
                  selectedFolderId,
                  onToggleFolder,
                  onSelectFolder,
                  onSelectPromptForEdit,
                  onDeletePrompt,
                  onDeleteFolder,
                  onRenameFolder,
                  onEditPrompt,
                  onMovePromptToFolder: selectedFolderId
                    ? onMovePromptToFolder
                    : undefined,
                  onMovePromptToRoot,
                })}
            </div>

            {/* Prompts in selected context */}
            <div className="border-t pt-2">
              <div className="mb-2 font-medium text-sm">
                {buildHeaderLabel({
                  debouncedQuery,
                  folderHierarchy: folderHierarchy as FolderNode[] | null,
                  selectedFolderId,
                  visibleLength: visiblePrompts?.length || 0,
                })}
              </div>
              <div className="divide-y">
                {!visiblePrompts || visiblePrompts.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    {debouncedQuery
                      ? 'No prompts found for your search.'
                      : 'No prompts yet. Use the form to create one.'}
                  </div>
                ) : (
                  visiblePrompts
                    .filter(
                      (p: PromptNode) =>
                        debouncedQuery ||
                        !selectedFolderId ||
                        p.folderId === selectedFolderId
                    )
                    .map((prompt: PromptNode) => (
                      <PromptListItem
                        key={prompt._id}
                        onCopy={onCopyPrompt}
                        onDelete={onDeletePrompt}
                        onSelect={onSelectPromptForEdit}
                        prompt={prompt}
                      />
                    ))
                )}
              </div>
            </div>

            {/* Most Used inside Explorer (condensed) */}
            <div className="border-t pt-2">
              <div className="mb-2 flex items-center gap-2 font-medium text-sm">
                <Star className="h-4 w-4" />
                Most Used
              </div>
              {!topPrompts || topPrompts.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground text-sm">
                  No usage yet
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1">
                  {topPrompts?.map((p: Doc<'prompts'>) => (
                    <TopPromptButton
                      content={p.content as string}
                      id={p._id as Id<'prompts'>}
                      key={p._id}
                      onCopy={onCopyPrompt}
                      title={p.title as string}
                      usageCount={p.usageCount as number}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column is left for the form panel in parent */}
          <div />
        </div>
      </div>
    </Card>
  );
}

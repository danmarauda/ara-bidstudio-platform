import type { Id } from '@convex/_generated/dataModel';

export type FolderNode = {
  _id: Id<'promptFolders'>;
  name: string;
  parentId?: Id<'promptFolders'> | null;
  children?: FolderNode[];
};

export type PromptNode = {
  _id: Id<'prompts'>;
  title: string;
  content: string;
  folderId?: Id<'promptFolders'> | null;
  usageCount: number;
  createdAt: number;
  updatedAt: number;
};

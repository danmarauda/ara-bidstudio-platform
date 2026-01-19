'use client';

import type { Id } from '@convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function PromptFormPanel(props: {
  editingPromptId: Id<'prompts'> | null;
  selectedFolderId?: Id<'promptFolders'>;
  formTitle: string;
  setFormTitle: (value: string) => void;
  formContent: string;
  setFormContent: (value: string) => void;
  onSave: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const {
    editingPromptId,
    selectedFolderId,
    formTitle,
    setFormTitle,
    formContent,
    setFormContent,
    onSave,
    onCancel,
  } = props;

  const canSave = Boolean(formTitle.trim() && formContent.trim());

  return (
    <div className="space-y-2 self-start md:sticky md:top-2">
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm">
          {editingPromptId ? 'Edit Prompt' : 'Create New Prompt'}
        </div>
        <Button
          onClick={() => {
            onCancel();
          }}
          size="sm"
          variant="ghost"
        >
          New
        </Button>
      </div>
      {selectedFolderId && !editingPromptId && (
        <div className="text-muted-foreground text-xs">
          Target: selected folder
        </div>
      )}
      <Input
        onChange={(e) => setFormTitle(e.target.value)}
        placeholder="Prompt title"
        value={formTitle}
      />
      <Textarea
        onChange={(e) => setFormContent(e.target.value)}
        placeholder="Write your prompt content..."
        rows={10}
        value={formContent}
      />
      <Button className="w-full" disabled={!canSave} onClick={onSave}>
        {editingPromptId ? 'Update Prompt' : 'Save Prompt'}
      </Button>
      {editingPromptId && (
        <Button className="w-full" onClick={onCancel} variant="ghost">
          Cancel Edit
        </Button>
      )}
    </div>
  );
}

'use client';

import { api, api as convexApi } from '@convex/_generated/api';
import type { Doc } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import {
  Download,
  HardDrive,
  Settings,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { MemoryExportData } from '@/lib/types/memory';
import { memoryTypeConfigs } from '@/lib/types/memory';

interface MemorySettingsProps {
  userId: string;
}

export function MemorySettings({ userId }: MemorySettingsProps) {
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [memoryEnabled, setMemoryEnabled] = useState(true);

  // Load user preferences to initialize the toggle
  const userPreferences = useQuery(convexApi.userPreferences.getByUserId, {
    userId,
  });
  const updateUserPreferences = useMutation(
    convexApi.userPreferences.updateUserPreferences
  );

  // Queries
  const stats = useQuery(api.memories.getStats, { userId });
  const memories = useQuery(api.memories.getUserMemories, { userId });

  // Mutations
  const clearAllMemories = useMutation(api.memories.remove);
  const bulkImport = useMutation(api.memories.bulkCreate);

  const handleToggleMemorySystem = async (enabled: boolean) => {
    try {
      setMemoryEnabled(enabled);
      // Persist preference in Convex so chat uses it
      await updateUserPreferences({ enableMemory: enabled });
      toast.success(`Memory system ${enabled ? 'enabled' : 'disabled'}`);
    } catch (_error) {
      toast.error('Failed to save preference');
    }
  };

  const handleClearAllMemories = async () => {
    if (!memories) {
      return;
    }

    try {
      // Delete all memories one by one (since there's no bulk delete in the API)
      const deletePromises = memories.map((memory: Doc<'memories'>) =>
        clearAllMemories({ id: memory._id })
      );
      await Promise.all(deletePromises);

      setShowClearDialog(false);
      toast.success('All memories cleared successfully');
    } catch (_error) {
      toast.error('Failed to clear memories');
    }
  };

  const handleExportMemories = async () => {
    if (!(memories && stats)) {
      return;
    }

    const exportData: MemoryExportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      userWalletAddress: userId,
      memories,
      stats,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `anubis-memories-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowExportDialog(false);
    toast.success('Memories exported successfully');
  };

  const handleImportMemories = async () => {
    if (!importFile) {
      return;
    }

    try {
      const fileContent = await importFile.text();
      const importData: MemoryExportData = JSON.parse(fileContent);

      if (!(importData.memories && Array.isArray(importData.memories))) {
        throw new Error('Invalid file format');
      }

      // Convert to import format (remove IDs and system fields)
      const memoriesToImport = importData.memories.map((memory) => ({
        userId,
        content: memory.content,
        type: memory.type,
        importance: memory.importance,
        embedding: memory.embedding,
        tags: memory.tags,
        sourceId: memory.sourceId,
        sourceType: memory.sourceType,
      }));

      await bulkImport({ memories: memoriesToImport });

      setShowImportDialog(false);
      setImportFile(null);
      toast.success(
        `Imported ${memoriesToImport.length} memories successfully`
      );
    } catch (_error) {
      toast.error('Failed to import memories. Please check the file format.');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setImportFile(file);
    } else {
      toast.error('Please select a valid JSON file');
    }
  };

  // Initialize toggle from preferences when loaded
  useEffect(() => {
    if (userPreferences) {
      setMemoryEnabled(userPreferences.enableMemory ?? true);
    }
  }, [userPreferences?.enableMemory, userPreferences]);

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const storageUsed = Math.min(
    (stats.total / 1000) * 100, // Assume 1000 memories = 100% for demo
    100
  );

  return (
    <div className="space-y-6">
      {/* Memory System Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Memory System Settings
          </CardTitle>
          <CardDescription>
            Control how ANUBIS remembers information from your conversations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="memory-enabled">Enable Memory System</Label>
              <p className="text-muted-foreground text-sm">
                Allow ANUBIS to remember facts, preferences, and context from
                your chats
              </p>
            </div>
            <Switch
              checked={memoryEnabled}
              id="memory-enabled"
              onCheckedChange={handleToggleMemorySystem}
            />
          </div>
        </CardContent>
      </Card>

      {/* Memory Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Memory Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="font-bold text-2xl text-primary">
                {stats.total}
              </div>
              <p className="text-muted-foreground text-sm">Total Memories</p>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-blue-600">
                {stats.totalAccesses}
              </div>
              <p className="text-muted-foreground text-sm">Total Accesses</p>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-green-600">
                {Math.round(stats.averageImportance * 100)}%
              </div>
              <p className="text-muted-foreground text-sm">Avg. Importance</p>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-purple-600">
                {
                  Object.keys(stats.byType).filter(
                    (type) => stats.byType[type] > 0
                  ).length
                }
              </div>
              <p className="text-muted-foreground text-sm">Memory Types</p>
            </div>
          </div>

          <Separator />

          {/* Memory by Type */}
          <div>
            <h4 className="mb-3 font-medium text-sm">Memory Distribution</h4>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
              {Object.entries(memoryTypeConfigs).map(([type, config]) => {
                const count = stats.byType[type] || 0;
                const percentage =
                  stats.total > 0 ? (count / stats.total) * 100 : 0;

                return (
                  <div className="rounded-lg border p-3 text-center" key={type}>
                    <div className="mb-1 text-lg">{config.icon}</div>
                    <div className="font-medium text-sm">{count}</div>
                    <p className="text-muted-foreground text-xs">
                      {config.label}
                    </p>
                    <div className="mt-2">
                      <Progress className="h-1" value={percentage} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Storage Usage */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-medium text-sm">Storage Usage</h4>
              <span className="text-muted-foreground text-sm">
                {storageUsed.toFixed(1)}%
              </span>
            </div>
            <Progress className="mb-2" value={storageUsed} />
            <p className="text-muted-foreground text-xs">
              Using {stats.total} of 1,000 memory slots
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Memory Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Memory Management
          </CardTitle>
          <CardDescription>
            Export, import, or clear your memory data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Export */}
            <Dialog onOpenChange={setShowExportDialog} open={showExportDialog}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Memories
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Memories</DialogTitle>
                  <DialogDescription>
                    Download all your memories as a JSON file for backup or
                    transfer.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted p-4">
                    <h4 className="mb-2 font-medium">Export includes:</h4>
                    <ul className="space-y-1 text-muted-foreground text-sm">
                      <li>• All memory content and metadata</li>
                      <li>• Memory types and importance scores</li>
                      <li>• Tags and source information</li>
                      <li>• Usage statistics</li>
                    </ul>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => setShowExportDialog(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleExportMemories}>
                      <Download className="mr-2 h-4 w-4" />
                      Export JSON
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Import */}
            <Dialog onOpenChange={setShowImportDialog} open={showImportDialog}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Import Memories
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Memories</DialogTitle>
                  <DialogDescription>
                    Upload a JSON file to restore memories from a backup.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="memory-file">Select JSON File</Label>
                    <Input
                      accept=".json"
                      className="mt-1"
                      id="memory-file"
                      onChange={handleFileChange}
                      type="file"
                    />
                  </div>
                  {importFile && (
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-sm">
                        Selected: <strong>{importFile.name}</strong>
                      </p>
                      <p className="mt-1 text-muted-foreground text-xs">
                        Size: {(importFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => {
                        setShowImportDialog(false);
                        setImportFile(null);
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={!importFile}
                      onClick={handleImportMemories}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Import
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Clear All */}
            <Button
              className="w-full"
              onClick={() => setShowClearDialog(true)}
              variant="destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          </div>

          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> Clearing memories will permanently delete
              all stored information. Consider exporting a backup first.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog onOpenChange={setShowClearDialog} open={showClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Memories</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all {stats.total} memories? This
              action cannot be undone and will permanently remove all stored
              information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAllMemories}>
              Delete All Memories
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

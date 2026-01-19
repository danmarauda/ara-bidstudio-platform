'use client';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { Bot, Edit, Save, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
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
} from '@/components/ui/dialog';
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
import { AI_MODELS } from '@/lib/constants/ai-models';

interface Agent {
  _id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  type: 'general' | 'research' | 'coding' | 'analysis';
  isPublic: boolean;
}

export function AgentManagement() {
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Query for public agents (admin view)
  const agents = useQuery(api.agents.listPublic) as Agent[] | undefined;

  // Mutation for updating agents
  const updateAgent = useMutation(api.agents.updatePublic);

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent({ ...agent });
    setIsDialogOpen(true);
  };

  const handleSaveAgent = async () => {
    if (!editingAgent) {
      return;
    }

    try {
      await updateAgent({
        id: editingAgent._id as Id<'agents'>,
        name: editingAgent.name,
        description: editingAgent.description,
        systemPrompt: editingAgent.systemPrompt,
        model: editingAgent.model,
        type: editingAgent.type,
      });

      toast.success(`${editingAgent.name} has been updated successfully.`);

      setIsDialogOpen(false);
      setEditingAgent(null);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update agent. Please try again.'
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingAgent(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-bold text-2xl tracking-tight">Agent Management</h2>
        <p className="text-muted-foreground">
          Manage public AI agents available to all users
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents?.map((agent) => (
          <Card className="relative" key={agent._id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                </div>
                <Button
                  onClick={() => handleEditAgent(agent)}
                  size="sm"
                  variant="ghost"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription className="text-sm">
                {agent.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium capitalize">{agent.type}</span>
              </div>
              <div className="mt-3">
                <p className="text-muted-foreground text-xs">System Prompt:</p>
                <p className="mt-1 max-h-20 overflow-y-auto rounded bg-muted/50 p-2 text-xs">
                  {agent.systemPrompt.substring(0, 200)}
                  {agent.systemPrompt.length > 200 && '...'}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Agent Dialog */}
      <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
            <DialogDescription>
              Update the agent's configuration and personality
            </DialogDescription>
          </DialogHeader>

          {editingAgent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    onChange={(e) =>
                      setEditingAgent({ ...editingAgent, name: e.target.value })
                    }
                    placeholder="Agent name"
                    value={editingAgent.name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Agent Type</Label>
                  <Select
                    onValueChange={(value: Agent['type']) =>
                      setEditingAgent({ ...editingAgent, type: value })
                    }
                    value={editingAgent.type}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Assistant</SelectItem>
                      <SelectItem value="research">
                        Research Specialist
                      </SelectItem>
                      <SelectItem value="coding">Coding Assistant</SelectItem>
                      <SelectItem value="analysis">Analysis Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">AI Model</Label>
                <Select
                  onValueChange={(value) =>
                    setEditingAgent({ ...editingAgent, model: value })
                  }
                  value={editingAgent.model}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name} - {model.provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  onChange={(e) =>
                    setEditingAgent({
                      ...editingAgent,
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief description of the agent's purpose"
                  rows={3}
                  value={editingAgent.description}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  className="font-mono text-sm"
                  id="systemPrompt"
                  onChange={(e) =>
                    setEditingAgent({
                      ...editingAgent,
                      systemPrompt: e.target.value,
                    })
                  }
                  placeholder="Define the agent's personality, behavior, and capabilities"
                  rows={8}
                  value={editingAgent.systemPrompt}
                />
              </div>

              <div className="flex justify-end space-x-2 border-t pt-4">
                <Button onClick={handleCancelEdit} variant="outline">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSaveAgent}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AgentManagement;

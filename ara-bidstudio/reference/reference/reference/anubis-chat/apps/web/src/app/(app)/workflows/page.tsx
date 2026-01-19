'use client';

import type { Doc, Id } from '@convex/_generated/dataModel';
import type { Edge, Node } from '@xyflow/react';
import {
  AlertTriangle,
  Crown,
  Edit,
  Grid3x3,
  List,
  Play,
  Plus,
  Trash2,
  Workflow,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdminGuard } from '@/components/auth/adminGuard';
import { UpgradePrompt } from '@/components/auth/upgradePrompt';
import {
  useAuthContext,
  useSubscriptionStatus,
} from '@/components/providers/auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Removed unused Tabs imports
import { Textarea } from '@/components/ui/textarea';
import WorkflowCanvas from '@/components/workflows/WorkflowCanvas';
import {
  useWorkflows,
  useWorkflowVisualData,
  type WorkflowMeta,
} from '@/hooks/convex/useWorkflows';

function WorkflowsContent() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowMeta | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkflowDialog, setNewWorkflowDialog] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({ name: '', description: '' });
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // user is not used in this component
  const { user } = useAuthContext();
  const subscription = useSubscriptionStatus();

  // Use actual wallet address from authenticated user
  const walletAddress = user?.walletAddress || 'demo-user';

  // Workflow creation limits based on subscription tier
  const canCreateWorkflows = subscription?.tier === 'pro_plus';
  let maxWorkflows = 999;
  if (subscription?.tier === 'free') {
    maxWorkflows = 0;
  } else if (subscription?.tier === 'pro') {
    maxWorkflows = 0;
  }

  // Use workflows hook
  const {
    workflows,
    createWorkflow,
    updateWorkflow,
    removeWorkflow,
    executeWorkflow,
    isLoading,
  } = useWorkflows(walletAddress);

  // Load visual data for selected workflow
  const { nodes, edges } = useWorkflowVisualData(selectedWorkflow?._id);

  // Create new workflow
  const handleCreateWorkflow = async () => {
    if (!newWorkflow.name.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }

    // Check subscription restrictions
    if (!canCreateWorkflows) {
      toast.error('Workflows require Pro+ subscription');
      setShowUpgradePrompt(true);
      return;
    }

    if (workflows.length >= maxWorkflows) {
      toast.error(
        `Maximum workflow limit (${maxWorkflows}) reached for your plan`
      );
      setShowUpgradePrompt(true);
      return;
    }

    try {
      const workflowId = await createWorkflow(
        newWorkflow.name,
        newWorkflow.description
      );

      // Create a temporary workflow object for editing
      const workflow: WorkflowMeta = {
        _id: workflowId,
        name: newWorkflow.name,
        description: newWorkflow.description,
        walletAddress,
        nodeCount: 0,
        edgeCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setSelectedWorkflow(workflow);
      setIsCreating(true);
      setNewWorkflowDialog(false);
      setNewWorkflow({ name: '', description: '' });
      toast.success('Workflow created successfully');
    } catch (_error) {
      toast.error('Failed to create workflow');
    }
  };

  // Save workflow
  const handleSaveWorkflow = async (newNodes: Node[], newEdges: Edge[]) => {
    if (!selectedWorkflow) {
      return;
    }

    try {
      await updateWorkflow(
        selectedWorkflow._id,
        newNodes,
        newEdges,
        selectedWorkflow
      );

      toast.success('Workflow saved successfully');
    } catch (_error) {
      toast.error('Failed to save workflow');
    }
  };

  // Execute workflow
  const handleExecuteWorkflow = async (workflow?: WorkflowMeta) => {
    const workflowToRun = workflow || selectedWorkflow;
    if (!workflowToRun) {
      return;
    }

    toast.info(`Executing workflow: ${workflowToRun.name}`);

    try {
      await executeWorkflow(workflowToRun._id);
      toast.success('Workflow execution started');
    } catch (_error) {
      toast.error('Error executing workflow');
    }
  };

  // Delete workflow
  const handleDeleteWorkflow = async (workflowId: Id<'workflows'>) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      try {
        await removeWorkflow(workflowId);

        if (selectedWorkflow?._id === workflowId) {
          setSelectedWorkflow(null);
          setIsEditing(false);
          setIsCreating(false);
        }
        toast.success('Workflow deleted successfully');
      } catch (_error) {
        toast.error('Failed to delete workflow');
      }
    }
  };

  // Edit workflow
  const handleEditWorkflow = (workflow: WorkflowMeta) => {
    setSelectedWorkflow(workflow);
    setIsEditing(true);
    setIsCreating(false);
  };

  // Back to list
  const handleBackToList = () => {
    setSelectedWorkflow(null);
    setIsEditing(false);
    setIsCreating(false);
  };

  if (isEditing || isCreating) {
    return (
      <div className="h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="font-semibold text-xl">{selectedWorkflow?.name}</h2>
            <p className="text-muted-foreground text-sm">
              {selectedWorkflow?.description}
            </p>
          </div>
          <Button onClick={handleBackToList} variant="outline">
            Back to Workflows
          </Button>
        </div>
        <div className="h-[calc(100%-73px)]">
          <WorkflowCanvas
            initialEdges={edges}
            initialNodes={nodes}
            onExecute={() => handleExecuteWorkflow()}
            onSave={handleSaveWorkflow}
            workflowId={selectedWorkflow?._id}
          />
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="font-semibold text-xl">Loading subscription...</h2>
          <p className="text-muted-foreground">
            Please wait while we load your subscription details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 font-bold text-3xl">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI Workflow Builder
              </span>
            </h1>
            <p className="text-muted-foreground">
              Create and manage automated multi-step workflows with AI agents
            </p>
          </div>
          <Badge
            className="gap-1"
            variant={subscription.tier === 'pro_plus' ? 'default' : 'secondary'}
          >
            <Crown className="h-3 w-3" />
            {subscription.tier} Plan
          </Badge>
        </div>

        {/* Tier restrictions alert */}
        {subscription.tier !== 'pro_plus' && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              AI Workflow Builder is a Pro+ exclusive feature.
              {subscription.tier === 'free'
                ? ' Upgrade to Pro+ to create and manage automated workflows.'
                : ' Upgrade from Pro to Pro+ to unlock workflow automation capabilities.'}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between">
        <Button
          className="gap-2"
          disabled={subscription.tier !== 'pro_plus'}
          onClick={() => {
            if (canCreateWorkflows) {
              setNewWorkflowDialog(true);
            } else {
              setShowUpgradePrompt(true);
            }
          }}
        >
          <Plus className="h-4 w-4" />
          Create New Workflow
          {subscription.tier !== 'pro_plus' && (
            <Badge className="ml-2 gap-1" variant="outline">
              <Crown className="h-3 w-3" />
              Pro+
            </Badge>
          )}
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode('grid')}
            size="icon"
            variant={viewMode === 'grid' ? 'default' : 'outline'}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setViewMode('list')}
            size="icon"
            variant={viewMode === 'list' ? 'default' : 'outline'}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Workflows Display */}
      {(() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center p-12">
              <p className="text-muted-foreground">Loading workflows...</p>
            </div>
          );
        }
        if (workflows.length === 0) {
          return (
            <Card className="p-12 text-center">
              <Workflow className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-semibold text-lg">No workflows yet</h3>
              <p className="mb-4 text-muted-foreground">
                {subscription.tier === 'pro_plus'
                  ? 'Create your first AI-powered workflow to automate complex processes'
                  : 'AI Workflow Builder is available with Pro+ subscription'}
              </p>
              <Button
                className="gap-2"
                disabled={subscription.tier !== 'pro_plus'}
                onClick={() => {
                  if (canCreateWorkflows) {
                    setNewWorkflowDialog(true);
                  } else {
                    setShowUpgradePrompt(true);
                  }
                }}
              >
                <Plus className="h-4 w-4" />
                {subscription.tier === 'pro_plus'
                  ? 'Create Your First Workflow'
                  : 'Upgrade to Pro+'}
              </Button>
            </Card>
          );
        }
        if (viewMode === 'grid') {
          return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workflows.map((workflow: Doc<'workflows'>) => (
                <Card className="p-6" key={workflow._id}>
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{workflow.name}</h3>
                      <p className="text-muted-foreground text-sm">
                        {workflow.description || 'No description'}
                      </p>
                    </div>
                    <Workflow className="h-5 w-5 text-primary" />
                  </div>
                  <div className="mb-3 text-muted-foreground text-xs">
                    <div>
                      {workflow.category
                        ? `Category: ${workflow.category}`
                        : 'No category'}
                    </div>
                    <div>
                      Updated:{' '}
                      {new Date(workflow.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      className="gap-1"
                      onClick={() => handleExecuteWorkflow(workflow)}
                      size="sm"
                      variant="outline"
                    >
                      <Play className="h-3 w-3" />
                      Run
                    </Button>
                    <Button
                      className="gap-1"
                      onClick={() => handleEditWorkflow(workflow)}
                      size="sm"
                      variant="outline"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      className="gap-1 text-destructive"
                      onClick={() => handleDeleteWorkflow(workflow._id)}
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          );
        }
        return (
          <div className="space-y-2">
            {workflows.map((workflow: Doc<'workflows'>) => (
              <Card className="p-4" key={workflow._id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Workflow className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-semibold">{workflow.name}</h3>
                      <p className="text-muted-foreground text-sm">
                        {workflow.description || 'No description'} • Updated:{' '}
                        {new Date(workflow.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleExecuteWorkflow(workflow)}
                      size="sm"
                      variant="outline"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleEditWorkflow(workflow)}
                      size="sm"
                      variant="outline"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteWorkflow(workflow._id)}
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        );
      })()}

      {/* New Workflow Dialog */}
      <Dialog onOpenChange={setNewWorkflowDialog} open={newWorkflowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
            <DialogDescription>
              Give your workflow a name and description to get started
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                onChange={(e) =>
                  setNewWorkflow({ ...newWorkflow, name: e.target.value })
                }
                placeholder="My Workflow"
                value={newWorkflow.name}
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                onChange={(e) =>
                  setNewWorkflow({
                    ...newWorkflow,
                    description: e.target.value,
                  })
                }
                placeholder="Describe what this workflow does..."
                value={newWorkflow.description}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setNewWorkflowDialog(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button onClick={handleCreateWorkflow}>Create Workflow</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <UpgradePrompt
          onDismiss={() => setShowUpgradePrompt(false)}
          prompt={{
            shouldShow: true,
            title: 'Upgrade to Pro+',
            message:
              'AI Workflow Builder requires a Pro+ subscription to create and manage automated multi-step workflows.',
            suggestedTier: 'pro_plus',
            urgency: 'high',
          }}
          variant="modal"
        />
      )}
    </div>
  );
}

export default function WorkflowsPage() {
  return (
    <AdminGuard>
      <WorkflowsContent />
    </AdminGuard>
  );
}

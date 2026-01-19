import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import type { Edge, Node } from '@xyflow/react';
import { useMutation, useQuery } from 'convex/react';
import { useCallback } from 'react';

export interface VisualWorkflowData {
  nodes: Node[];
  edges: Edge[];
}

export interface WorkflowMeta {
  _id: Id<'workflows'>;
  _creationTime?: number;
  name: string;
  description?: string;
  walletAddress: string;
  category?:
    | 'research'
    | 'automation'
    | 'data'
    | 'communication'
    | 'development'
    | 'custom';
  tags?: string[];
  isTemplate?: boolean;
  isPublic?: boolean;
  version?: string;
  isActive?: boolean;
  nodeCount?: number;
  edgeCount?: number;
  createdAt: number;
  updatedAt: number;
}

export function useWorkflows(walletAddress: string) {
  // Queries
  const workflows = useQuery(api.workflows.listVisualWorkflows, {
    walletAddress,
    includeTemplates: false,
  });

  const templates = useQuery(api.workflows.getWorkflowTemplates, {});

  // Mutations
  const saveVisualWorkflow = useMutation(api.workflows.saveVisualWorkflow);
  const deleteWorkflow = useMutation(api.workflows.remove);
  const cloneWorkflow = useMutation(api.workflows.cloneWorkflow);
  const createExecution = useMutation(api.workflows.createExecution);

  // Helper functions
  const createWorkflow = useCallback(
    async (name: string, description?: string) => {
      return await saveVisualWorkflow({
        name,
        description,
        walletAddress,
        nodes: [],
        edges: [],
      });
    },
    [saveVisualWorkflow, walletAddress]
  );

  const updateWorkflow = useCallback(
    async (
      workflowId: Id<'workflows'>,
      nodes: Node[],
      edges: Edge[],
      metadata?: Partial<WorkflowMeta>
    ) => {
      return await saveVisualWorkflow({
        id: workflowId,
        name: metadata?.name || 'Untitled Workflow',
        description: metadata?.description,
        walletAddress,
        category: metadata?.category,
        tags: metadata?.tags,
        isTemplate: metadata?.isTemplate,
        isPublic: metadata?.isPublic,
        nodes: nodes as any,
        edges: edges as any,
      });
    },
    [saveVisualWorkflow, walletAddress]
  );

  const removeWorkflow = useCallback(
    async (workflowId: Id<'workflows'>) => {
      return await deleteWorkflow({
        id: workflowId,
        walletAddress,
      });
    },
    [deleteWorkflow, walletAddress]
  );

  const duplicateWorkflow = useCallback(
    async (sourceId: Id<'workflows'>, newName: string) => {
      return await cloneWorkflow({
        sourceId,
        newName,
        walletAddress,
      });
    },
    [cloneWorkflow, walletAddress]
  );

  const executeWorkflow = useCallback(
    async (workflowId: Id<'workflows'>, variables?: unknown) => {
      return await createExecution({
        workflowId,
        walletAddress,
        variables: variables as
          | Record<string, string | number | boolean | null>
          | undefined,
      });
    },
    [createExecution, walletAddress]
  );

  const getWorkflowById = useCallback(
    async (workflowId: Id<'workflows'>) => {
      // This would typically be a query, but since we need it as a function,
      // we'll need to implement it differently or use the listVisualWorkflows
      // and filter client-side
      const allWorkflows = workflows || [];
      return allWorkflows.find((w: Doc<'workflows'>) => w._id === workflowId);
    },
    [workflows]
  );

  return {
    workflows: workflows || [],
    templates: templates || [],
    createWorkflow,
    updateWorkflow,
    removeWorkflow,
    duplicateWorkflow,
    executeWorkflow,
    getWorkflowById,
    isLoading: workflows === undefined,
  };
}

// Hook for loading a single workflow's visual data
export function useWorkflowVisualData(workflowId?: Id<'workflows'>) {
  const visualData = useQuery(
    api.workflows.getVisualWorkflow,
    workflowId ? { id: workflowId } : 'skip'
  );

  return {
    nodes: visualData?.nodes || [],
    edges: visualData?.edges || [],
    workflow: visualData,
    isLoading: workflowId && visualData === undefined,
  };
}

// Hook for workflow executions
export function useWorkflowExecutions(workflowId?: Id<'workflows'>) {
  const executions = useQuery(
    api.workflows.getExecutionsByWorkflow,
    workflowId ? { workflowId } : 'skip'
  );

  return {
    executions: executions || [],
    isLoading: workflowId && executions === undefined,
  };
}

// Hook for workflow statistics
export function useWorkflowStats(walletAddress: string) {
  const stats = useQuery(api.workflows.getWorkflowStats, { walletAddress });

  return {
    stats,
    isLoading: stats === undefined,
  };
}

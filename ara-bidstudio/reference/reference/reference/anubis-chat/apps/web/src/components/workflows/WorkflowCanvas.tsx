'use client';

import type { Connection, Edge, Node, NodeTypes } from '@xyflow/react';
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import { useCallback, useRef, useState } from 'react';
import '@xyflow/react/dist/style.css';
import {
  Download,
  Play,
  Redo,
  Save,
  Sparkles,
  Trash2,
  Undo,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import CustomNode from './CustomNode';
import WorkflowSidebar from './WorkflowSidebar';
import type { WorkflowNodeData, WorkflowTemplate } from './workflow-types';

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

interface WorkflowHistory {
  nodes: Node[];
  edges: Edge[];
}

interface WorkflowCanvasProps {
  workflowId?: string | unknown;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onExecute?: () => void;
}

function WorkflowCanvasContent({
  workflowId,
  initialNodes = [],
  initialEdges = [],
  onSave,
  onExecute,
}: WorkflowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [_selectedNode, setSelectedNode] = useState<Node | null>(null);
  const { getIntersectingNodes, fitView } = useReactFlow();
  const [history, setHistory] = useState<WorkflowHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Save state to history for undo/redo
  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: [...nodes], edges: [...edges] });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [nodes, edges, history, historyIndex]);

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(newEdge, eds));
      saveToHistory();
    },
    [setEdges, saveToHistory]
  );

  // Undo action
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Handle drag over
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      const nodeDataString = event.dataTransfer.getData('nodeData');

      if (!(type && nodeDataString)) {
        return;
      }

      const nodeData = JSON.parse(nodeDataString) as WorkflowNodeData;

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode: Node = {
        id: `${type}_${Date.now()}`,
        type: 'custom',
        position,
        data: nodeData as unknown as Record<string, unknown>,
      };

      setNodes((nds) => nds.concat(newNode));
      saveToHistory();
    },
    [setNodes, saveToHistory]
  );

  // Handle node selection
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Delete selected elements
  const _handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
    saveToHistory();
  }, [setNodes, setEdges, saveToHistory]);

  // Clear canvas
  const handleClear = useCallback(() => {
    if (confirm('Are you sure you want to clear the entire workflow?')) {
      setNodes([]);
      setEdges([]);
      saveToHistory();
    }
  }, [setNodes, setEdges, saveToHistory]);

  // Save workflow
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(nodes, edges);
      toast.success('Workflow saved successfully');
    }
  }, [nodes, edges, onSave]);

  // Execute workflow
  const handleExecute = useCallback(() => {
    if (onExecute) {
      onExecute();
      toast.info('Workflow execution started');
    }
  }, [onExecute]);

  // Generate AI workflow
  const handleAIGenerate = useCallback(async () => {
    toast.info('Generating AI workflow...');
    // TODO: Implement AI workflow generation
    setTimeout(() => {
      // Mock AI generation
      const aiNodes: Node[] = [
        {
          id: 'start_ai',
          type: 'custom',
          position: { x: 100, y: 100 },
          data: {
            type: 'start',
            label: 'Start',
            description: 'Workflow begins here',
          },
        },
        {
          id: 'agent_ai',
          type: 'custom',
          position: { x: 250, y: 100 },
          data: {
            type: 'agent',
            label: 'AI Analysis',
            description: 'Analyze input data',
          },
        },
        {
          id: 'condition_ai',
          type: 'custom',
          position: { x: 400, y: 100 },
          data: {
            type: 'condition',
            label: 'Check Result',
            description: 'Evaluate analysis',
          },
        },
        {
          id: 'task_ai_1',
          type: 'custom',
          position: { x: 550, y: 50 },
          data: {
            type: 'task',
            label: 'Process A',
            description: 'Handle positive case',
          },
        },
        {
          id: 'task_ai_2',
          type: 'custom',
          position: { x: 550, y: 150 },
          data: {
            type: 'task',
            label: 'Process B',
            description: 'Handle negative case',
          },
        },
        {
          id: 'end_ai',
          type: 'custom',
          position: { x: 700, y: 100 },
          data: { type: 'end', label: 'End', description: 'Workflow complete' },
        },
      ];

      const aiEdges: Edge[] = [
        { id: 'e1', source: 'start_ai', target: 'agent_ai', animated: true },
        {
          id: 'e2',
          source: 'agent_ai',
          target: 'condition_ai',
          animated: true,
        },
        {
          id: 'e3',
          source: 'condition_ai',
          target: 'task_ai_1',
          label: 'Yes',
          animated: true,
        },
        {
          id: 'e4',
          source: 'condition_ai',
          target: 'task_ai_2',
          label: 'No',
          animated: true,
        },
        { id: 'e5', source: 'task_ai_1', target: 'end_ai', animated: true },
        { id: 'e6', source: 'task_ai_2', target: 'end_ai', animated: true },
      ];

      setNodes(aiNodes);
      setEdges(aiEdges);
      saveToHistory();
      toast.success('AI workflow generated successfully');
      setTimeout(() => fitView(), 100);
    }, 2000);
  }, [setNodes, setEdges, saveToHistory, fitView]);

  // Export workflow
  const handleExport = useCallback(() => {
    const workflow = {
      nodes,
      edges,
      metadata: {
        created: new Date().toISOString(),
        version: '1.0.0',
      },
    };
    const blob = new Blob([JSON.stringify(workflow, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Workflow exported successfully');
  }, [nodes, edges]);

  // Import workflow
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        try {
          const result = event.target?.result;
          if (typeof result !== 'string') {
            return;
          }

          const workflow = JSON.parse(result);
          setNodes(workflow.nodes || []);
          setEdges(workflow.edges || []);
          saveToHistory();
          toast.success('Workflow imported successfully');
          setTimeout(() => fitView(), 100);
        } catch (_error) {
          toast.error('Failed to import workflow');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [setNodes, setEdges, saveToHistory, fitView]);

  // Load template
  const handleLoadTemplate = useCallback(
    (template: WorkflowTemplate) => {
      setNodes(template.nodes);
      setEdges(template.edges);
      saveToHistory();
      setTimeout(() => fitView(), 100);
    },
    [setNodes, setEdges, saveToHistory, fitView]
  );

  return (
    <div className="flex h-full">
      <WorkflowSidebar onLoadTemplate={handleLoadTemplate} />
      <div className="relative flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          deleteKeyCode={['Delete', 'Backspace']}
          edges={edges}
          fitView
          nodes={nodes}
          nodeTypes={nodeTypes}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodesChange={onNodesChange}
        >
          <Background color="#0f172a" variant={BackgroundVariant.Dots} />
          <MiniMap
            nodeColor={(node) => {
              const type =
                ((node.data as unknown as Record<string, unknown>)
                  ?.type as string) || 'default';
              const colors: Record<string, string> = {
                start: '#10b981',
                end: '#ef4444',
                task: '#3b82f6',
                agent: '#a855f7',
                condition: '#eab308',
                parallel: '#6366f1',
                loop: '#f97316',
                webhook: '#06b6d4',
                delay: '#6b7280',
                approval: '#ec4899',
                subworkflow: '#14b8a6',
              };
              return colors[type] || '#94a3b8';
            }}
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
            }}
          />
          <Controls />

          {/* Top Panel */}
          <Panel position="top-center">
            <Card className="flex gap-2 p-2">
              <Button
                disabled={historyIndex <= 0}
                onClick={handleUndo}
                size="sm"
                variant="outline"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                disabled={historyIndex >= history.length - 1}
                onClick={handleRedo}
                size="sm"
                variant="outline"
              >
                <Redo className="h-4 w-4" />
              </Button>
              <div className="mx-1 w-px bg-border" />
              <Button onClick={handleAIGenerate} size="sm" variant="outline">
                <Sparkles className="mr-1 h-4 w-4" />
                AI Generate
              </Button>
              <Button onClick={handleImport} size="sm" variant="outline">
                <Upload className="mr-1 h-4 w-4" />
                Import
              </Button>
              <Button onClick={handleExport} size="sm" variant="outline">
                <Download className="mr-1 h-4 w-4" />
                Export
              </Button>
              <Button onClick={handleClear} size="sm" variant="outline">
                <Trash2 className="mr-1 h-4 w-4" />
                Clear
              </Button>
              <div className="mx-1 w-px bg-border" />
              <Button onClick={handleSave} size="sm" variant="outline">
                <Save className="mr-1 h-4 w-4" />
                Save
              </Button>
              <Button onClick={handleExecute} size="sm">
                <Play className="mr-1 h-4 w-4" />
                Execute
              </Button>
            </Card>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

export default function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasContent {...props} />
    </ReactFlowProvider>
  );
}

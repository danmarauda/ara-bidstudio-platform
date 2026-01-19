'use client';

import {
  Bot,
  CheckSquare,
  Clock,
  Flag,
  GitBranch,
  GitPullRequest,
  Layers,
  Layers as LayersIcon,
  Play,
  Repeat,
  Search,
  Sparkles,
  UserCheck,
  Webhook,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { workflowTemplates } from './workflow-templates';
import {
  type NodeType,
  nodeTypes,
  type WorkflowAgent,
  type WorkflowNodeData,
  type WorkflowTemplate,
} from './workflow-types';

const iconMap: Record<NodeType, ComponentType<{ className?: string }>> = {
  start: Play,
  end: Flag,
  task: CheckSquare,
  agent: Bot,
  condition: GitBranch,
  parallel: GitPullRequest,
  loop: Repeat,
  webhook: Webhook,
  delay: Clock,
  approval: UserCheck,
  subworkflow: LayersIcon,
};

const availableAgents: WorkflowAgent[] = [
  { id: 'researcher', name: 'Research Agent', model: 'gpt-4o' },
  { id: 'coder', name: 'Coding Agent', model: 'gpt-4o' },
  { id: 'analyst', name: 'Data Analyst', model: 'gpt-4o' },
  { id: 'writer', name: 'Content Writer', model: 'gpt-4o' },
];

interface WorkflowSidebarProps {
  onLoadTemplate?: (template: WorkflowTemplate) => void;
}

export default function WorkflowSidebar({
  onLoadTemplate,
}: WorkflowSidebarProps = {}) {
  const [searchTerm, setSearchTerm] = useState('');

  const onDragStart = (
    event: React.DragEvent,
    nodeType: NodeType,
    nodeData: WorkflowNodeData
  ) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('nodeData', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  const filteredNodes = nodeTypes.filter((node) =>
    node.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTemplates = workflowTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTemplateClick = (template: WorkflowTemplate) => {
    if (onLoadTemplate) {
      onLoadTemplate(template);
      toast.success(`Loaded template: ${template.name}`);
    } else {
      toast.info('Template loading not available in this context');
    }
  };

  return (
    <Card className="h-full w-80 rounded-none border-r">
      <div className="border-b p-4">
        <h3 className="mb-3 font-semibold">Workflow Builder</h3>
        <div className="relative">
          <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search components..."
            value={searchTerm}
          />
        </div>
      </div>

      <Tabs className="h-[calc(100%-88px)]" defaultValue="nodes">
        <TabsList className="w-full rounded-none border-b">
          <TabsTrigger className="flex-1" value="nodes">
            <Layers className="mr-1 h-4 w-4" />
            Nodes
          </TabsTrigger>
          <TabsTrigger className="flex-1" value="templates">
            <Sparkles className="mr-1 h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger className="flex-1" value="agents">
            <Bot className="mr-1 h-4 w-4" />
            Agents
          </TabsTrigger>
        </TabsList>

        <TabsContent className="m-0 h-full" value="nodes">
          <ScrollArea className="h-full p-4">
            <div className="space-y-2">
              {filteredNodes.map((node) => {
                const Icon = iconMap[node.type] || CheckSquare;
                return (
                  <div
                    className={`cursor-move rounded-lg border-2 p-3 transition-all hover:shadow-md ${node.color} border-opacity-50 bg-opacity-10 `}
                    draggable
                    key={node.type}
                    onDragStart={(e) =>
                      onDragStart(e, node.type, {
                        label: node.label,
                        type: node.type,
                      })
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded bg-background/50 p-2">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{node.label}</div>
                        <div className="text-muted-foreground text-xs">
                          Drag to canvas
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent className="m-0 h-full" value="templates">
          <ScrollArea className="h-full p-4">
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <Card
                  className="cursor-pointer p-3 transition-all hover:shadow-md"
                  key={template.id}
                  onClick={() => handleTemplateClick(template)}
                >
                  <div className="mb-1 font-medium text-sm">
                    {template.name}
                  </div>
                  <div className="mb-2 text-muted-foreground text-xs">
                    {template.description}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge className="text-xs" variant="secondary">
                      {template.category}
                    </Badge>
                    <div className="text-muted-foreground text-xs">
                      {template.nodes.length} nodes
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent className="m-0 h-full" value="agents">
          <ScrollArea className="h-full p-4">
            <div className="space-y-2">
              {availableAgents.map((agent) => (
                <div
                  className="cursor-move rounded-lg border-2 border-purple-500/50 bg-purple-500/10 p-3 transition-all hover:shadow-md"
                  draggable
                  key={agent.id}
                  onDragStart={(e) =>
                    onDragStart(e, 'agent', {
                      label: agent.name,
                      type: 'agent',
                      config: {
                        agentId: agent.id,
                      },
                    })
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded bg-background/50 p-2">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{agent.name}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

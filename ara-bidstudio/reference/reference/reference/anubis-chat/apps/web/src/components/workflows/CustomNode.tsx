'use client';

import { Handle, Position } from '@xyflow/react';
import {
  Bot,
  CheckSquare,
  Clock,
  Flag,
  GitBranch,
  GitPullRequest,
  Layers,
  Play,
  Repeat,
  UserCheck,
  Webhook,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { memo } from 'react';
import { Card } from '@/components/ui/card';
import type { NodeType, WorkflowNodeData } from './workflow-types';

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
  subworkflow: Layers,
};

const colorMap: Record<NodeType, string> = {
  start: 'border-green-500 bg-green-500/10',
  end: 'border-red-500 bg-red-500/10',
  task: 'border-blue-500 bg-blue-500/10',
  agent: 'border-purple-500 bg-purple-500/10',
  condition: 'border-yellow-500 bg-yellow-500/10',
  parallel: 'border-indigo-500 bg-indigo-500/10',
  loop: 'border-orange-500 bg-orange-500/10',
  webhook: 'border-cyan-500 bg-cyan-500/10',
  delay: 'border-gray-500 bg-gray-500/10',
  approval: 'border-pink-500 bg-pink-500/10',
  subworkflow: 'border-teal-500 bg-teal-500/10',
};

interface CustomNodeProps {
  data: WorkflowNodeData;
  selected?: boolean;
}

function CustomNode({ data, selected }: CustomNodeProps) {
  const Icon = iconMap[data.type] || CheckSquare;
  const colorClass = colorMap[data.type] || 'border-gray-500 bg-gray-500/10';
  const showTopHandle = data.type !== 'start';
  const showBottomHandle = data.type !== 'end';

  return (
    <>
      {showTopHandle && (
        <Handle
          className="!bg-primary !w-2 !h-2"
          position={Position.Top}
          type="target"
        />
      )}
      <Card
        className={`min-w-[180px] border-2 p-3 transition-all ${colorClass} ${selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}hover:shadow-lg cursor-move `}
      >
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-background/50 p-2">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">{data.label}</div>
            {data.description && (
              <div className="mt-1 text-muted-foreground text-xs">
                {data.description}
              </div>
            )}
          </div>
        </div>
        {data.config && Object.keys(data.config).length > 0 && (
          <div className="mt-2 border-border/50 border-t pt-2">
            <div className="text-muted-foreground text-xs">
              {Object.keys(data.config).length} config
              {Object.keys(data.config).length > 1 ? 's' : ''}
            </div>
          </div>
        )}
      </Card>
      {showBottomHandle && (
        <Handle
          className="!bg-primary !w-2 !h-2"
          position={Position.Bottom}
          type="source"
        />
      )}
    </>
  );
}

export default memo(CustomNode);

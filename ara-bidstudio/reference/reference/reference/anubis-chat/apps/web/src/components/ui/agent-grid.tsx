'use client';

import { Bot } from 'lucide-react';
import { useState } from 'react';
import type { Agent } from '@/components/providers/solana-agent-provider';
import { AgentCard } from '@/components/ui/agent-card';
import {
  AgentTypeFilter,
  type AgentTypeFilter as AgentTypeFilterType,
} from '@/components/ui/agent-type-filter';

interface AgentGridProps {
  agents: Agent[];
  selectedAgentId?: string;
  onAgentSelect: (agent: Agent) => void;
  columns?: 2 | 3 | 4 | 5;
  showFilter?: boolean;
  compact?: boolean;
  className?: string;
  filterClassName?: string;
  gridClassName?: string;
}

export function AgentGrid({
  agents,
  selectedAgentId,
  onAgentSelect,
  columns = 5,
  showFilter = true,
  compact = false,
  className = '',
  filterClassName = '',
  gridClassName = '',
}: AgentGridProps) {
  const [typeFilter, setTypeFilter] = useState<AgentTypeFilterType>('all');

  // Filter agents based on type
  const filteredAgents = agents.filter((agent) => {
    if (typeFilter === 'all') {
      return true;
    }
    return agent.type === typeFilter;
  });

  const getGridCols = () => {
    switch (columns) {
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      default:
        return 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {showFilter && (
        <AgentTypeFilter
          agents={agents}
          className={filterClassName}
          onSelect={setTypeFilter}
          selected={typeFilter}
        />
      )}

      <div
        className={`grid ${getGridCols()} gap-1.5 sm:gap-2 ${gridClassName}`}
      >
        {filteredAgents.map((agent) => (
          <AgentCard
            agent={agent}
            compact={compact}
            isSelected={selectedAgentId === agent._id}
            key={agent._id}
            onClick={onAgentSelect}
          />
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          <Bot className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p>No agents found for the selected type.</p>
        </div>
      )}
    </div>
  );
}

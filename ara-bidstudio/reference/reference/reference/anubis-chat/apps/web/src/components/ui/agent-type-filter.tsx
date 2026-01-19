'use client';

import {
  BarChart3,
  Bot,
  Coins,
  Image,
  Settings,
  TrendingUp,
  Vote,
} from 'lucide-react';
import type { Agent } from '@/components/providers/solana-agent-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export type AgentTypeFilter = 'all' | Agent['type'];

interface AgentTypeFilterProps {
  selected: AgentTypeFilter;
  onSelect: (type: AgentTypeFilter) => void;
  agents: Agent[];
  className?: string;
}

const getAgentIcon = (type: Agent['type']) => {
  switch (type) {
    case 'trading':
      return <TrendingUp className="h-3 w-3" />;
    case 'defi':
      return <Coins className="h-3 w-3" />;
    case 'nft':
      return <Image className="h-3 w-3" />;
    case 'dao':
      return <Vote className="h-3 w-3" />;
    case 'portfolio':
      return <BarChart3 className="h-3 w-3" />;
    case 'custom':
      return <Settings className="h-3 w-3" />;
    default:
      return <Bot className="h-3 w-3" />;
  }
};

const getTypeName = (type: Agent['type']) => {
  switch (type) {
    case 'trading':
      return 'Trading';
    case 'defi':
      return 'DeFi';
    case 'nft':
      return 'NFT';
    case 'dao':
      return 'DAO';
    case 'portfolio':
      return 'Portfolio';
    case 'custom':
      return 'Custom';
    default:
      return 'General';
  }
};

export function AgentTypeFilter({
  selected,
  onSelect,
  agents,
  className,
}: AgentTypeFilterProps) {
  // Get unique agent types with counts
  const typeCounts = agents.reduce(
    (acc, agent) => {
      acc[agent.type] = (acc[agent.type] || 0) + 1;
      return acc;
    },
    {} as Record<Agent['type'], number>
  );

  const availableTypes = Object.keys(typeCounts) as Agent['type'][];

  const filterOptions = [
    {
      value: 'all' as const,
      label: 'All Agents',
      count: agents.length,
    },
    ...availableTypes.map((type) => ({
      value: type,
      label: getTypeName(type),
      count: typeCounts[type],
    })),
  ];

  return (
    <div
      className={`flex flex-wrap gap-2 rounded-lg bg-muted p-1 ${className}`}
    >
      {filterOptions.map((option) => (
        <Button
          className="flex items-center gap-1.5"
          key={option.value}
          onClick={() => onSelect(option.value)}
          size="sm"
          variant={selected === option.value ? 'default' : 'ghost'}
        >
          {option.value !== 'all' &&
            getAgentIcon(option.value as Agent['type'])}
          <span>{option.label}</span>
          <Badge className="px-1.5 text-xs" variant="secondary">
            {option.count}
          </Badge>
        </Button>
      ))}
    </div>
  );
}

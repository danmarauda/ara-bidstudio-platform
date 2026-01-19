'use client';

import {
  BarChart3,
  Bot,
  Check,
  Coins,
  Image,
  Settings,
  TrendingUp,
  Vote,
  Zap,
} from 'lucide-react';
import type { Agent } from '@/components/providers/solana-agent-provider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AgentCardProps {
  agent: Agent;
  isSelected?: boolean;
  onClick: (agent: Agent) => void;
  className?: string;
  compact?: boolean;
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

const getAgentColor = () => 'bg-primary/10 text-primary dark:bg-primary/15';

const getAgentDescription = (agent: Agent) => {
  if (agent.description) {
    return agent.description;
  }

  // Fallback descriptions
  switch (agent.type) {
    case 'trading':
      return 'Specialized in token trading, swaps, and market analysis';
    case 'defi':
      return 'Expert in DeFi protocols, lending, staking, and yield farming';
    case 'nft':
      return 'Handles NFT creation, trading, and marketplace operations';
    case 'dao':
      return 'Manages DAO governance, voting, and proposal creation';
    case 'portfolio':
      return 'Tracks portfolio performance and provides analytics';
    default:
      return 'General-purpose AI assistant with blockchain capabilities';
  }
};

const getAgentTypeName = (type: Agent['type']) => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

export function AgentCard({
  agent,
  isSelected = false,
  onClick,
  className,
  compact = false,
}: AgentCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-md',
        isSelected && 'border-primary ring-1 ring-primary',
        compact ? 'min-h-[80px]' : 'min-h-[100px]',
        className
      )}
      onClick={() => onClick(agent)}
    >
      <CardHeader className={cn('p-2', compact ? 'pb-1' : 'pb-1.5')}>
        <div className="flex items-start justify-between gap-1">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <div
              className={cn(
                'flex flex-shrink-0 items-center justify-center rounded-lg',
                compact ? 'h-5 w-5 text-xs' : 'h-6 w-6 text-xs',
                getAgentColor()
              )}
            >
              {getAgentIcon(agent.type)}
            </div>
            <h3
              className={cn(
                'truncate font-semibold',
                compact ? 'text-[10px]' : 'text-xs'
              )}
              title={agent.name}
            >
              {agent.name}
            </h3>
          </div>
          {isSelected && (
            <Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <Badge
            className={cn(
              'border-0 text-[10px]',
              compact ? 'h-3.5 px-1 py-0' : 'h-4 px-1 py-0',
              getAgentColor()
            )}
            variant="outline"
          >
            {getAgentTypeName(agent.type)}
          </Badge>

          {!agent.isPublic && (
            <Badge
              className={cn('px-1 py-0 text-[10px]', compact ? 'h-3.5' : 'h-4')}
              variant="secondary"
            >
              Custom
            </Badge>
          )}

          {isSelected && (
            <Badge
              className={cn(
                'bg-primary/10 px-1 py-0 text-[10px] text-primary dark:bg-primary/15',
                compact ? 'h-3.5' : 'h-4'
              )}
            >
              Active
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className={cn('p-2', compact ? 'pt-0' : 'pt-0.5')}>
        {!compact && (
          <p className="mb-1.5 line-clamp-2 text-[10px] text-muted-foreground leading-snug">
            {getAgentDescription(agent)}
          </p>
        )}

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] text-muted-foreground">
            <div className="flex items-center gap-0.5">
              <Zap className="h-2.5 w-2.5" />
              <span>{agent.capabilities.length} capabilities</span>
            </div>
            {agent.version && <span>v{agent.version}</span>}
          </div>

          <div className="flex flex-wrap gap-0.5">
            {agent.capabilities.slice(0, 2).map((capability) => (
              <Badge
                className={cn(
                  'px-1 py-0 text-[9px]',
                  compact ? 'h-3' : 'h-3.5'
                )}
                key={capability}
                variant="outline"
              >
                {capability}
              </Badge>
            ))}
            {agent.capabilities.length > 2 && (
              <Badge
                className={cn(
                  'px-1 py-0 text-[9px] text-muted-foreground',
                  compact ? 'h-3' : 'h-3.5'
                )}
                variant="outline"
              >
                +{agent.capabilities.length - 2}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

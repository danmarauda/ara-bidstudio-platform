'use client';

import { Bot, Clock, Cpu, Plus, Settings, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Mock data - replace with actual data from your backend
const mockAgents = [
  {
    id: '1',
    name: 'Trading Assistant',
    status: 'active',
    type: 'trading',
    lastActive: '2 hours ago',
    starred: true,
  },
  {
    id: '2',
    name: 'DeFi Analyzer',
    status: 'idle',
    type: 'analytics',
    lastActive: '1 day ago',
    starred: false,
  },
  {
    id: '3',
    name: 'NFT Scout',
    status: 'active',
    type: 'nft',
    lastActive: '5 minutes ago',
    starred: true,
  },
  {
    id: '4',
    name: 'Wallet Monitor',
    status: 'inactive',
    type: 'monitoring',
    lastActive: '3 days ago',
    starred: false,
  },
];

export function AgentsSidebar() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">AI Agents</h2>
            <p className="text-muted-foreground text-sm">
              {mockAgents.length} agents available
            </p>
          </div>
          <Button className="h-8" size="sm" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b px-4 pb-2">
        <div className="flex gap-2">
          <Button className="h-7 text-xs" size="sm" variant="ghost">
            All
          </Button>
          <Button className="h-7 text-xs" size="sm" variant="ghost">
            Active
          </Button>
          <Button className="h-7 text-xs" size="sm" variant="ghost">
            Starred
          </Button>
        </div>
      </div>

      {/* Agents List */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="space-y-2">
          {mockAgents.map((agent) => (
            <div
              className="group cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted"
              key={agent.id}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{agent.name}</span>
                    {agent.starred && (
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      className="h-5 text-xs"
                      variant={
                        agent.status === 'active' ? 'default' : 'secondary'
                      }
                    >
                      {agent.status}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      <Clock className="mr-1 inline h-3 w-3" />
                      {agent.lastActive}
                    </span>
                  </div>
                </div>
                <Button
                  className="h-7 w-7 opacity-0 group-hover:opacity-100"
                  size="icon"
                  variant="ghost"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="border-t p-4">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <div className="flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            <span>3 active</span>
          </div>
          <div>
            <span>CPU: 24%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { AlertCircle, CheckCircle, Plus, Power, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Mock MCP servers data
const mockServers = [
  {
    id: '1',
    name: 'File System',
    type: 'filesystem',
    status: 'connected',
    description: 'Access to local file system',
    port: 3000,
  },
  {
    id: '2',
    name: 'GitHub',
    type: 'github',
    status: 'connected',
    description: 'GitHub API integration',
    port: 3001,
  },
  {
    id: '3',
    name: 'Memory',
    type: 'memory',
    status: 'disconnected',
    description: 'Persistent memory storage',
    port: 3002,
  },
  {
    id: '4',
    name: 'Web Search',
    type: 'search',
    status: 'error',
    description: 'Web search capabilities',
    port: 3003,
  },
];

export function McpSidebar() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <Power className="h-4 w-4 text-gray-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-500/10 text-green-600" variant="outline">
            Connected
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge className="bg-gray-500/10 text-gray-600" variant="outline">
            Disconnected
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-500/10 text-red-600" variant="outline">
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">MCP Servers</h2>
            <p className="text-muted-foreground text-sm">
              Manage your MCP connections
            </p>
          </div>
          <Button className="h-8" size="sm" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Server List */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="space-y-2 pb-4">
          {mockServers.map((server) => (
            <div
              className="group rounded-lg border p-3 transition-colors hover:bg-muted"
              key={server.id}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(server.status)}
                    <span className="font-medium text-sm">{server.name}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground text-xs">
                    {server.description}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    {getStatusBadge(server.status)}
                    <span className="text-muted-foreground text-xs">
                      Port: {server.port}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <Button className="h-7 w-7" size="icon" variant="ghost">
                    <Power className="h-3 w-3" />
                  </Button>
                  <Button className="h-7 w-7" size="icon" variant="ghost">
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="border-t p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Connected</span>
            <span className="font-medium">2 / 4</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: '50%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

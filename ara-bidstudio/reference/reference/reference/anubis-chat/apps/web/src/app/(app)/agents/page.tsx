'use client';

import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import {
  Bot,
  Brain,
  Copy,
  MoreVertical,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/data/empty-states';
import { LoadingStates } from '@/components/data/loading-states';
import { useAuthContext } from '@/components/providers/auth-provider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Agent type icons; colors now driven by theme tokens
const getAgentTypeInfo = (type: string) => {
  switch (type) {
    case 'general':
      return {
        color: 'bg-primary/10 text-primary',
        ring: 'hover:ring-primary/20',
        gradient: 'from-primary/5',
        accent: 'border-l-primary/20',
        icon: Bot,
      };
    case 'trading':
      return {
        color: 'bg-primary/10 text-primary',
        ring: 'hover:ring-primary/20',
        gradient: 'from-primary/5',
        accent: 'border-l-primary/20',
        icon: Zap,
      };
    case 'defi':
      return {
        color: 'bg-primary/10 text-primary',
        ring: 'hover:ring-primary/20',
        gradient: 'from-primary/5',
        accent: 'border-l-primary/20',
        icon: Sparkles,
      };
    case 'nft':
      return {
        color: 'bg-primary/10 text-primary',
        ring: 'hover:ring-primary/20',
        gradient: 'from-primary/5',
        accent: 'border-l-primary/20',
        icon: Brain,
      };
    case 'portfolio':
      return {
        color: 'bg-primary/10 text-primary',
        ring: 'hover:ring-primary/20',
        gradient: 'from-primary/5',
        accent: 'border-l-primary/20',
        icon: Brain,
      };
    case 'custom':
      return {
        color: 'bg-primary/10 text-primary',
        ring: 'hover:ring-primary/20',
        gradient: 'from-primary/5',
        accent: 'border-l-primary/20',
        icon: Settings,
      };
    default:
      return {
        color: 'bg-primary/10 text-primary',
        ring: 'hover:ring-primary/20',
        gradient: 'from-primary/5',
        accent: 'border-l-primary/20',
        icon: Bot,
      };
  }
};

export default function AgentsPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);
  const [showPublicAgents, setShowPublicAgents] = useState(true);

  // Initialize default agents mutation
  const initializeAgents = useMutation(api.agents.initializeDefaults);

  // Fetch all agents (public and user's custom)
  const agents = useQuery(
    api.agents.list,
    user?.walletAddress
      ? { includePublic: showPublicAgents, userId: user.walletAddress }
      : { includePublic: true }
  );

  // Delete mutation
  const deleteAgent = useMutation(api.agents.remove);

  // Initialize default agents on first load
  useEffect(() => {
    initializeAgents().catch(() => {
      /* intentionally ignore initialization errors in UI */
    });
  }, [initializeAgents]);

  const handleDeleteAgent = async () => {
    if (!(deleteAgentId && user?.walletAddress)) {
      return;
    }

    try {
      await deleteAgent({
        id: deleteAgentId as Id<'agents'>,
        userId: user.walletAddress,
      });
      toast.success('Agent deleted successfully');
      setDeleteAgentId(null);
    } catch (_error) {
      toast.error('Failed to delete agent');
    }
  };

  type AgentSummary = {
    name: string;
    description?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  };

  const handleDuplicateAgent = (agent: AgentSummary) => {
    // Navigate to create page with pre-filled data
    const params = new URLSearchParams({
      name: `${agent.name} (Copy)`,
      description: agent.description || '',
      systemPrompt: agent.systemPrompt || '',
      temperature: agent.temperature?.toString() || '0.7',
      maxTokens: agent.maxTokens?.toString() || '4096',
    });
    router.push(`/agents/new?${params.toString()}`);
  };

  if (!user?.walletAddress) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <h2 className="font-semibold text-xl">Connect Wallet</h2>
          <p className="mt-2 text-muted-foreground">
            Please connect your wallet to view and manage agents
          </p>
        </div>
      </div>
    );
  }

  if (agents === undefined) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <LoadingStates text="Loading agents..." variant="spinner" />
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-b from-primary/5 dark:from-primary/10">
      {/* Full-width header */}
      <div className="w-full p-4 md:p-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h1 className="whitespace-nowrap bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text font-semibold text-2xl text-transparent sm:text-3xl">
                AI Agents
              </h1>
              <p className="mt-1 text-muted-foreground text-sm">
                Manage your custom AI agents and assistants
              </p>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:justify-end">
              <Button asChild>
                <Link href="/agents/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Agent
                </Link>
              </Button>
              <Button
                onClick={() => setShowPublicAgents(!showPublicAgents)}
                size="sm"
                variant="outline"
              >
                {showPublicAgents ? 'Hide' : 'Show'} Public Agents
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Constrained content */}
      <div className="mx-auto w-full max-w-6xl space-y-3 p-3 sm:space-y-4 sm:p-4 md:p-6">
        {/* Agents Grid */}
        {agents.length === 0 ? (
          <Card className="p-8 sm:p-10">
            <EmptyState
              action={{
                label: 'Create Agent',
                onClick: () => router.push('/agents/new'),
              }}
              description="Create your first AI agent to get started"
              icon={<Bot className="h-12 w-12 text-muted-foreground" />}
              title="No agents yet"
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-2.5">
            {agents.map((agent: Doc<'agents'>) => {
              const typeInfo = getAgentTypeInfo(agent.type);
              const _TypeIcon = typeInfo.icon;

              return (
                <Card
                  className={cn(
                    'group relative flex h-full flex-col overflow-hidden border border-border/60 p-2.5 transition-colors sm:p-3',
                    'bg-gradient-to-b from-transparent to-card/40 dark:to-card/20',
                    'hover:ring-1 hover:ring-primary/20',
                    'border-l-2 border-l-primary/20'
                  )}
                  key={agent._id}
                >
                  <CardHeader className="border-border/50 border-b pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="min-w-0">
                          <CardTitle className="truncate font-semibold text-[13.5px] tracking-tight sm:text-[15.5px]">
                            {agent.name}
                          </CardTitle>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            {agent.isPublic && (
                              <Badge
                                className="text-[10px] sm:text-xs"
                                variant="secondary"
                              >
                                Public
                              </Badge>
                            )}
                            <Badge
                              className="text-[10px] sm:text-xs"
                              variant="outline"
                            >
                              {agent.type}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Action Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            className="h-8 w-8 p-0 opacity-100 transition-opacity hover:opacity-100"
                            size="sm"
                            variant="ghost"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!agent.isPublic && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/agents/${agent._id}/edit`)
                                }
                              >
                                <Settings className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDuplicateAgent(agent)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          {!agent.isPublic && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteAgentId(agent._id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col pt-1 sm:pt-1.5">
                    <CardDescription className="line-clamp-2 text-[12px] leading-snug sm:text-sm">
                      {agent.description ||
                        agent.systemPrompt ||
                        'No description provided'}
                    </CardDescription>

                    {/* Agent Stats */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-[11px] text-muted-foreground sm:text-xs">
                      <div className="rounded-md border px-1.5 py-0.5 leading-none">
                        <span>Temp:</span>
                        <span className="font-medium">
                          {agent.temperature || 0.7}
                        </span>
                      </div>
                      {agent.maxTokens && (
                        <div className="rounded-md border px-1.5 py-0.5 leading-none">
                          <span>Tokens:</span>
                          <span className="font-medium">{agent.maxTokens}</span>
                        </div>
                      )}
                      {agent.capabilities && agent.capabilities.length > 0 && (
                        <div className="rounded-md border px-1.5 py-0.5 leading-none">
                          <span>Tools:</span>
                          <span className="font-medium">
                            {agent.capabilities.length}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Created Date */}
                    <div className="mt-auto pt-2 text-[11px] text-muted-foreground sm:text-xs">
                      Created {new Date(agent.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          onOpenChange={() => setDeleteAgentId(null)}
          open={!!deleteAgentId}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Agent</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this agent? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAgent}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

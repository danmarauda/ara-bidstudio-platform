'use client';

import {
  BookOpen,
  Code2,
  Coins,
  FileText,
  Globe,
  Info,
  Shield,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface MCPStatusResponse {
  initialized: boolean;
  servers: Array<{
    name: string;
    description?: string;
    transport: string;
    tools: string[];
  }>;
  totalTools: number;
  availableTools: string[];
}

interface MCPApiResponse {
  data?: MCPStatusResponse;
}

function isMCPStatusResponse(obj: unknown): obj is MCPStatusResponse {
  if (obj == null || typeof obj !== 'object') {
    return false;
  }
  const maybe = obj as Partial<MCPStatusResponse> & Record<string, unknown>;
  return typeof maybe.initialized === 'boolean' && Array.isArray(maybe.servers);
}

export default function MCPServersPage() {
  const [status, setStatus] = useState<MCPStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchServerStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/mcp/servers', { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (isMCPStatusResponse(json)) {
          setStatus(json);
        } else if (json && typeof json === 'object' && 'data' in json) {
          const apiResponse = json as MCPApiResponse;
          setStatus(apiResponse.data || null);
        } else {
          setStatus(null);
        }
      }
    } catch (_error) {
      toast.error('Failed to fetch server status');
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        await fetchServerStatus();
      } finally {
        setIsLoading(false);
      }
    };
    load().catch(() => {
      setIsLoading(false);
    });
  }, [fetchServerStatus]);

  const handleInitContext7 = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/mcp/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'context7',
          transport: {
            type: 'http',
            url: 'https://mcp.context7.com/mcp',
            headers: {
              'Content-Type': 'application/json',
            },
          },
          description:
            'Access to library documentation, code examples, and best practices',
        }),
      });

      if (res.ok) {
        toast.success('Context7 server initialized successfully!');
        await fetchServerStatus();
      } else {
        const error = await res.text();
        toast.error(`Failed to initialize Context7: ${error}`);
      }
    } catch (_error) {
      toast.error('Failed to initialize Context7 server. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-b from-primary/5 dark:from-primary/10">
      {/* Full-width header */}
      <div className="w-full p-4 md:p-6">
        <div className="mx-auto w-full max-w-6xl">
          <h1 className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text font-semibold text-2xl text-transparent sm:text-3xl">
            MCP Servers
          </h1>
          <p className="text-muted-foreground">
            Manage Model Context Protocol servers and tools.
          </p>
        </div>
      </div>

      {/* Constrained content */}
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
        {/* Context7 Feature Card */}
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-transparent p-6 dark:border-blue-800 dark:from-blue-950">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="font-semibold text-lg">Context7 MCP Server</h2>
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  Featured
                </Badge>
              </div>
              <p className="mb-4 text-muted-foreground text-sm">
                Access comprehensive library documentation, code examples, and
                best practices for over 50,000 libraries.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Info className="mr-2 h-4 w-4" />
                    Learn More
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                      Context7 MCP Integration
                    </DialogTitle>
                    <DialogDescription>
                      Enhance your AI agents with real-time access to library
                      documentation
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-2 flex items-center gap-2 font-medium">
                        <BookOpen className="h-4 w-4" />
                        What is Context7?
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Context7 is a specialized MCP server that provides your
                        AI agents with instant access to up-to-date
                        documentation for thousands of libraries and frameworks.
                        It helps your agents provide accurate, current
                        information about APIs, best practices, and code
                        examples.
                      </p>
                    </div>

                    <div>
                      <h3 className="mb-2 flex items-center gap-2 font-medium">
                        <Code2 className="h-4 w-4" />
                        Key Features
                      </h3>
                      <ul className="space-y-2 text-muted-foreground text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>
                            <strong>50,000+ Libraries:</strong> Coverage for
                            major JavaScript, Python, Go, Rust, and other
                            language ecosystems
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>
                            <strong>Real-time Updates:</strong> Documentation is
                            continuously updated to reflect the latest versions
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>
                            <strong>Code Examples:</strong> Access to practical
                            code snippets and implementation patterns
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>
                            <strong>Smart Search:</strong> Intelligent library
                            resolution and topic-focused documentation retrieval
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="mb-2 flex items-center gap-2 font-medium">
                        <FileText className="h-4 w-4" />
                        Best Practices for Your Agents
                      </h3>
                      <ul className="space-y-2 text-muted-foreground text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>
                            <strong>Library Questions:</strong> Enable Context7
                            when your agent needs to answer questions about
                            specific libraries or frameworks
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>
                            <strong>Code Generation:</strong> Use it to ensure
                            generated code follows the latest API patterns and
                            best practices
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>
                            <strong>Debugging Help:</strong> Leverage
                            documentation to help users troubleshoot
                            library-specific issues
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>
                            <strong>Learning Support:</strong> Perfect for
                            educational agents that teach programming concepts
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="mb-2 flex items-center gap-2 font-medium">
                        <Globe className="h-4 w-4" />
                        How to Use
                      </h3>
                      <ol className="space-y-2 text-muted-foreground text-sm">
                        <li>
                          1. Enable Context7 when creating or editing an agent
                        </li>
                        <li>
                          2. Your agent will automatically have access to
                          50,000+ library documentation
                        </li>
                        <li>
                          3. Ask questions like "How do I use React hooks?" or
                          "Show me Next.js App Router examples"
                        </li>
                        <li>
                          4. Context7 fetches real-time, version-specific
                          documentation directly from the source
                        </li>
                      </ol>
                    </div>

                    <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950">
                      <p className="text-amber-900 text-sm dark:text-amber-100">
                        <strong>Rate Limits:</strong> Context7 has a rate limit
                        of 100 requests per hour per user. Responses are cached
                        to optimize usage. For production use with higher
                        limits, consider self-hosting the Context7 MCP server.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </Card>

        {/* Solana Feature Card */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-transparent p-6 dark:border-purple-800 dark:from-purple-950">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Coins className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h2 className="font-semibold text-lg">Solana MCP Server</h2>
                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  Blockchain
                </Badge>
              </div>
              <p className="mb-4 text-muted-foreground text-sm">
                Complete Solana blockchain integration for wallet operations,
                token management, DeFi interactions, and smart contracts.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Info className="mr-2 h-4 w-4" />
                    Learn More
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-purple-600" />
                      Solana MCP Integration
                    </DialogTitle>
                    <DialogDescription>
                      Enable your AI agents to interact with the Solana
                      blockchain
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-2 flex items-center gap-2 font-medium">
                        <Wallet className="h-4 w-4" />
                        What is Solana MCP?
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Solana MCP is an AI-powered development assistant that
                        provides your agents with expert knowledge about Solana
                        blockchain development. It offers real-time access to
                        Solana documentation, Anchor framework expertise, and
                        best practices for building on Solana through three
                        specialized tools.
                      </p>
                    </div>

                    <div>
                      <h3 className="mb-2 flex items-center gap-2 font-medium">
                        <Shield className="h-4 w-4" />
                        Key Features
                      </h3>
                      <ul className="space-y-2 text-muted-foreground text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>
                            <strong>Solana Expert:</strong> Ask detailed
                            questions about Solana development, concepts, APIs,
                            SDKs, and error resolution
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>
                            <strong>Documentation Search:</strong> Search across
                            the entire Solana documentation corpus using
                            advanced RAG technology
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>
                            <strong>Anchor Framework Expert:</strong> Get
                            specialized help with Anchor framework, including
                            events, CPI, and version-specific guidance
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>
                            <strong>Real-time Updates:</strong> Access the
                            latest Solana documentation and best practices
                            directly in your IDE
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>
                            <strong>Secure Integration:</strong> Built with
                            security in mind, minimizing sensitive information
                            exposure
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="mb-2 flex items-center gap-2 font-medium">
                        <Code2 className="h-4 w-4" />
                        Best Practices for Your Agents
                      </h3>
                      <ul className="space-y-2 text-muted-foreground text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600">•</span>
                          <span>
                            <strong>Development Questions:</strong> "How are CPI
                            events implemented in Anchor 0.31?"
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600">•</span>
                          <span>
                            <strong>Build Complex DeFi:</strong> "Build an AMM
                            that supports token-2022 and older tokens"
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600">•</span>
                          <span>
                            <strong>Staking Mechanisms:</strong> "How can I
                            implement a staking mechanism with time-locked
                            rewards?"
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600">•</span>
                          <span>
                            <strong>Best Practices:</strong> "What are the best
                            practices for handling decimal values in Solana
                            programs?"
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="mb-2 flex items-center gap-2 font-medium">
                        <Globe className="h-4 w-4" />
                        How to Use
                      </h3>
                      <ol className="space-y-2 text-muted-foreground text-sm">
                        <li>
                          1. Enable Solana MCP when creating or editing an agent
                        </li>
                        <li>
                          2. Your agent gains access to three specialized Solana
                          development tools
                        </li>
                        <li>
                          3. Ask development questions like "How do I implement
                          events in Anchor?"
                        </li>
                        <li>
                          4. The agent searches real-time documentation and
                          provides expert guidance
                        </li>
                      </ol>
                    </div>

                    <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950">
                      <p className="text-amber-900 text-sm dark:text-amber-100">
                        <strong>Usage Note:</strong> This MCP server provides
                        documentation and development guidance only. For actual
                        blockchain operations (transactions, wallet management),
                        you'll need to integrate the Solana SDK separately. The
                        server focuses on helping developers build better Solana
                        applications.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          {isLoading && (
            <div className="text-muted-foreground text-sm">
              Loading servers...
            </div>
          )}
          {!isLoading && status && (
            <div className="space-y-4">
              <div className="text-muted-foreground text-sm">
                Initialized:{' '}
                <span className="font-medium text-foreground">
                  {status.initialized ? 'Yes' : 'No'}
                </span>
              </div>
              {isRefreshing && (
                <div className="animate-pulse text-muted-foreground text-sm">
                  Refreshing server data...
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {status.servers.map((s) => {
                  const isContext7 = s.name === 'context7';
                  return (
                    <Card
                      className={`p-4 ${isContext7 ? 'border-blue-200 dark:border-blue-800' : ''}`}
                      key={s.name}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="flex items-center gap-2 font-medium">
                            {s.name}
                            {isContext7 && (
                              <Badge className="text-xs" variant="secondary">
                                Recommended
                              </Badge>
                            )}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {s.description ?? 'No description'}
                          </p>
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {s.transport}
                        </span>
                      </div>
                      <div className="mt-3 text-muted-foreground text-xs">
                        Tools:{' '}
                        {s.tools.length > 0 ? s.tools.join(', ') : 'None'}
                      </div>
                    </Card>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={isRefreshing}
                  onClick={handleInitContext7}
                  size="sm"
                  variant="outline"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isRefreshing ? 'Initializing...' : 'Initialize Context7'}
                </Button>
                <Button
                  disabled={isRefreshing}
                  onClick={async () => {
                    setIsRefreshing(true);
                    try {
                      const res = await fetch('/api/mcp/servers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: 'solana',
                          transport: {
                            type: 'http',
                            url: 'https://mcp.solana.com/mcp',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                          },
                          description:
                            'Solana developer assistant with documentation search and Anchor framework expertise',
                        }),
                      });

                      if (res.ok) {
                        toast.success(
                          'Solana server initialized successfully!'
                        );
                        await fetchServerStatus();
                      } else {
                        const error = await res.text();
                        toast.error(`Failed to initialize Solana: ${error}`);
                      }
                    } catch (_error) {
                      toast.error(
                        'Failed to initialize Solana server. Please try again.'
                      );
                    } finally {
                      setIsRefreshing(false);
                    }
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Coins className="mr-2 h-4 w-4" />
                  {isRefreshing ? 'Initializing...' : 'Initialize Solana'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

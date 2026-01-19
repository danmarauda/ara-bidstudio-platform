'use client';

import {
  Root as Accordion,
  Content as AccordionContent,
  Item as AccordionItem,
  Trigger as AccordionTrigger,
} from '@radix-ui/react-accordion';
import {
  Check,
  Code,
  Copy,
  Database,
  Globe,
  Info,
  Layers,
  Lock,
  Package,
  Play,
  Plus,
  RefreshCw,
  Server,
  Settings,
  Sparkles,
  Terminal,
  TestTube,
  Trash2,
  Webhook,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { AgentTool } from './types';

export interface Tool extends AgentTool {
  type: 'api' | 'webhook' | 'script' | 'blockchain' | 'database' | 'custom';
  method?: string;
  headers?: Record<string, string>;
  auth?: {
    type: 'none' | 'api_key' | 'oauth' | 'basic';
    credentials?: Record<string, string>;
  };
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    default?: unknown;
  }>;
  response?: {
    type: string;
    schema?: unknown;
  };
  testData?: unknown;
}

interface AgentToolBuilderProps {
  tools: Tool[];
  onChange: (tools: Tool[]) => void;
}

const toolTemplates = [
  {
    id: 'openai',
    name: 'OpenAI API',
    type: 'api',
    icon: Sparkles,
    description: 'Connect to OpenAI models',
    category: 'AI',
  },
  {
    id: 'coingecko',
    name: 'CoinGecko API',
    type: 'api',
    icon: Globe,
    description: 'Cryptocurrency price data',
    category: 'Market Data',
  },
  {
    id: 'jupiter',
    name: 'Jupiter Aggregator',
    type: 'blockchain',
    icon: Zap,
    description: 'Solana DEX aggregator',
    category: 'DeFi',
  },
  {
    id: 'helius',
    name: 'Helius RPC',
    type: 'blockchain',
    icon: Server,
    description: 'Solana RPC and webhooks',
    category: 'Blockchain',
  },
  {
    id: 'discord-webhook',
    name: 'Discord Webhook',
    type: 'webhook',
    icon: Webhook,
    description: 'Send messages to Discord',
    category: 'Communication',
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    type: 'database',
    icon: Database,
    description: 'Connect to PostgreSQL database',
    category: 'Database',
  },
  {
    id: 'custom-script',
    name: 'Custom Script',
    type: 'script',
    icon: Code,
    description: 'Run custom JavaScript code',
    category: 'Custom',
  },
];

export function AgentToolBuilder({
  tools = [],
  onChange,
}: AgentToolBuilderProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [testingTool, setTestingTool] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<
      string,
      {
        success: boolean;
        response: {
          data: string;
          timestamp: number;
        };
      }
    >
  >({});
  const [_selectedTemplate, setSelectedTemplate] = useState<string | null>(
    null
  );

  const [newTool, setNewTool] = useState<Partial<Tool>>({
    name: '',
    type: 'api',
    description: '',
    endpoint: '',
    method: 'GET',
    headers: {},
    auth: { type: 'none' },
    parameters: [],
    enabled: true,
  });

  const handleAddTool = () => {
    const tool: Tool = {
      id: `tool_${Date.now()}`,
      name: newTool.name || 'New Tool',
      type: newTool.type || 'api',
      description: newTool.description || '',
      endpoint: newTool.endpoint,
      method: newTool.method,
      headers: newTool.headers,
      auth: newTool.auth,
      parameters: newTool.parameters,
      config: {},
      enabled: true,
    };

    onChange([...tools, tool]);
    setShowAddDialog(false);
    resetNewTool();
  };

  const resetNewTool = () => {
    setNewTool({
      name: '',
      type: 'api',
      description: '',
      endpoint: '',
      method: 'GET',
      headers: {},
      auth: { type: 'none' },
      parameters: [],
      enabled: true,
    });
    setSelectedTemplate(null);
  };

  const handleDeleteTool = (toolId: string) => {
    onChange(tools.filter((t) => t.id !== toolId));
  };

  const handleToggleTool = (toolId: string) => {
    onChange(
      tools.map((t) => (t.id === toolId ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const handleTestTool = async (tool: Tool) => {
    setTestingTool(tool.id);
    // Simulate API test
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setTestResults({
      ...testResults,
      [tool.id]: {
        success: true,
        response: { data: 'Test successful', timestamp: Date.now() },
      },
    });
    setTestingTool(null);
  };

  const getToolIcon = (type: string) => {
    switch (type) {
      case 'api':
        return Globe;
      case 'webhook':
        return Webhook;
      case 'script':
        return Code;
      case 'blockchain':
        return Layers;
      case 'database':
        return Database;
      default:
        return Terminal;
    }
  };

  const getToolBadgeColor = (type: string) => {
    switch (type) {
      case 'api':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'webhook':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'script':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'blockchain':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'database':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Tool Templates */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm">Quick Add Tools</h3>
            <p className="mt-1 text-muted-foreground text-xs">
              Select from popular integrations
            </p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            size="sm"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Custom Tool
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {toolTemplates.map((template) => {
            const Icon = template.icon;
            const isAdded = tools.some((t) => t.name === template.name);

            return (
              <Card
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  isAdded && 'opacity-50'
                )}
                key={template.id}
                onClick={() => {
                  if (!isAdded) {
                    setSelectedTemplate(template.id);
                    setNewTool({
                      ...newTool,
                      name: template.name,
                      type: template.type as Tool['type'],
                      description: template.description,
                    });
                    setShowAddDialog(true);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        getToolBadgeColor(template.type)
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <p className="mt-1 text-muted-foreground text-xs">
                        {template.description}
                      </p>
                      <Badge className="mt-2 text-xs" variant="outline">
                        {template.category}
                      </Badge>
                    </div>
                    {isAdded && <Check className="h-4 w-4 text-green-500" />}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Configured Tools */}
      {tools.length > 0 && (
        <div>
          <h3 className="mb-4 font-medium text-sm">Configured Tools</h3>
          <Accordion className="space-y-2" collapsible type="single">
            {tools.map((tool) => {
              const Icon = getToolIcon(tool.type);
              const testResult = testResults[tool.id];

              return (
                <AccordionItem
                  className="rounded-lg border"
                  key={tool.id}
                  value={tool.id}
                >
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex w-full items-center justify-between pr-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-md',
                            getToolBadgeColor(tool.type)
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">
                              {tool.name}
                            </span>
                            <Badge className="text-xs" variant="outline">
                              {tool.type}
                            </Badge>
                            {!tool.enabled && (
                              <Badge className="text-xs" variant="secondary">
                                Disabled
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-muted-foreground text-xs">
                            {tool.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={tool.enabled}
                          onCheckedChange={() => handleToggleTool(tool.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4 pt-4">
                      {/* Tool Details */}
                      <div className="grid gap-4 md:grid-cols-2">
                        {tool.endpoint && (
                          <div className="space-y-1">
                            <Label className="text-xs">Endpoint</Label>
                            <code className="rounded bg-muted px-2 py-1 text-xs">
                              {tool.endpoint}
                            </code>
                          </div>
                        )}

                        {tool.method && (
                          <div className="space-y-1">
                            <Label className="text-xs">Method</Label>
                            <Badge variant="outline">{tool.method}</Badge>
                          </div>
                        )}

                        {tool.auth?.type && tool.auth.type !== 'none' && (
                          <div className="space-y-1">
                            <Label className="text-xs">Authentication</Label>
                            <div className="flex items-center space-x-2">
                              <Lock className="h-3 w-3" />
                              <span className="text-xs capitalize">
                                {tool.auth.type}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Parameters */}
                      {tool.parameters && tool.parameters.length > 0 && (
                        <div>
                          <Label className="text-xs">Parameters</Label>
                          <div className="mt-2 space-y-1">
                            {tool.parameters.map((param) => (
                              <div
                                className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-xs"
                                key={`${param.name}-${param.type}`}
                              >
                                <span>
                                  <code>{param.name}</code>
                                  <span className="ml-2 text-muted-foreground">
                                    ({param.type})
                                  </span>
                                  {param.required && (
                                    <span className="ml-1 text-red-500">*</span>
                                  )}
                                </span>
                                <span className="text-muted-foreground">
                                  {param.description}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between border-t pt-2">
                        <div className="flex items-center space-x-2">
                          <Button
                            disabled={testingTool === tool.id}
                            onClick={() => handleTestTool(tool)}
                            size="sm"
                            variant="outline"
                          >
                            {testingTool === tool.id ? (
                              <>
                                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                                Testing...
                              </>
                            ) : (
                              <>
                                <TestTube className="mr-2 h-3 w-3" />
                                Test
                              </>
                            )}
                          </Button>

                          {testResult && (
                            <Badge
                              className="text-xs"
                              variant={
                                testResult.success ? 'default' : 'destructive'
                              }
                            >
                              {testResult.success ? 'Success' : 'Failed'}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => setEditingTool(tool)}
                            size="sm"
                            variant="ghost"
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteTool(tool.id)}
                            size="sm"
                            variant="ghost"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      )}

      {/* Empty State */}
      {tools.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-medium text-sm">No tools configured</h3>
            <p className="mt-2 text-center text-muted-foreground text-sm">
              Add tools to extend your agent's capabilities
            </p>
            <Button
              className="mt-4"
              onClick={() => setShowAddDialog(true)}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Tool
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Tool Dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingTool(null);
            resetNewTool();
          }
        }}
        open={showAddDialog || !!editingTool}
      >
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTool ? 'Edit Tool' : 'Add New Tool'}
            </DialogTitle>
            <DialogDescription>
              Configure the tool integration for your agent
            </DialogDescription>
          </DialogHeader>

          <Tabs className="mt-4" defaultValue="basic">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="auth">Authentication</TabsTrigger>
              <TabsTrigger value="params">Parameters</TabsTrigger>
              <TabsTrigger value="test">Test</TabsTrigger>
            </TabsList>

            <TabsContent className="mt-4 space-y-4" value="basic">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tool-name">Name</Label>
                  <Input
                    id="tool-name"
                    onChange={(e) => {
                      if (editingTool) {
                        setEditingTool({
                          ...editingTool,
                          name: e.target.value,
                        });
                      } else {
                        setNewTool({ ...newTool, name: e.target.value });
                      }
                    }}
                    placeholder="e.g., OpenAI GPT-4"
                    value={editingTool?.name || newTool.name}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tool-type">Type</Label>
                  <Select
                    onValueChange={(value: Tool['type']) => {
                      if (editingTool) {
                        setEditingTool({ ...editingTool, type: value });
                      } else {
                        setNewTool({ ...newTool, type: value });
                      }
                    }}
                    value={editingTool?.type || newTool.type}
                  >
                    <SelectTrigger id="tool-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                      <SelectItem value="script">Script</SelectItem>
                      <SelectItem value="blockchain">Blockchain</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tool-description">Description</Label>
                  <Textarea
                    id="tool-description"
                    onChange={(e) => {
                      if (editingTool) {
                        setEditingTool({
                          ...editingTool,
                          description: e.target.value,
                        });
                      } else {
                        setNewTool({ ...newTool, description: e.target.value });
                      }
                    }}
                    placeholder="Describe what this tool does..."
                    value={editingTool?.description || newTool.description}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tool-endpoint">Endpoint URL</Label>
                  <Input
                    id="tool-endpoint"
                    onChange={(e) => {
                      if (editingTool) {
                        setEditingTool({
                          ...editingTool,
                          endpoint: e.target.value,
                        });
                      } else {
                        setNewTool({ ...newTool, endpoint: e.target.value });
                      }
                    }}
                    placeholder="https://api.example.com/v1/endpoint"
                    value={editingTool?.endpoint || newTool.endpoint}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent className="mt-4 space-y-4" value="auth">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Authentication Type</Label>
                  <Select
                    onValueChange={(
                      value: 'none' | 'api_key' | 'oauth' | 'basic'
                    ) => {
                      if (editingTool) {
                        setEditingTool({
                          ...editingTool,
                          auth: { ...editingTool.auth, type: value },
                        });
                      } else {
                        setNewTool({
                          ...newTool,
                          auth: { ...newTool.auth, type: value },
                        });
                      }
                    }}
                    value={editingTool?.auth?.type || newTool.auth?.type}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="oauth">OAuth 2.0</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(editingTool?.auth?.type || newTool.auth?.type) !== 'none' && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2 text-muted-foreground text-sm">
                        <Info className="h-4 w-4" />
                        <span>Credentials will be securely stored</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent className="mt-4 space-y-4" value="params">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Parameters</Label>
                  <Button
                    onClick={() => {
                      const newParam = {
                        name: '',
                        type: 'string',
                        required: false,
                        description: '',
                      };

                      if (editingTool) {
                        setEditingTool({
                          ...editingTool,
                          parameters: [
                            ...(editingTool.parameters || []),
                            newParam,
                          ],
                        });
                      } else {
                        setNewTool({
                          ...newTool,
                          parameters: [...(newTool.parameters || []), newParam],
                        });
                      }
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    Add Parameter
                  </Button>
                </div>

                {(editingTool?.parameters || newTool.parameters || []).map(
                  (param, index) => (
                    <Card key={`${param.name}-${index}`}>
                      <CardContent className="pt-4">
                        <div className="grid gap-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              onChange={(e) => {
                                const params =
                                  editingTool?.parameters ||
                                  newTool.parameters ||
                                  [];
                                params[index] = {
                                  ...param,
                                  name: e.target.value,
                                };

                                if (editingTool) {
                                  setEditingTool({
                                    ...editingTool,
                                    parameters: params,
                                  });
                                } else {
                                  setNewTool({
                                    ...newTool,
                                    parameters: params,
                                  });
                                }
                              }}
                              placeholder="Parameter name"
                              value={param.name}
                            />
                            <Select
                              onValueChange={(value) => {
                                const params =
                                  editingTool?.parameters ||
                                  newTool.parameters ||
                                  [];
                                params[index] = { ...param, type: value };

                                if (editingTool) {
                                  setEditingTool({
                                    ...editingTool,
                                    parameters: params,
                                  });
                                } else {
                                  setNewTool({
                                    ...newTool,
                                    parameters: params,
                                  });
                                }
                              }}
                              value={param.type}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="string">String</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="boolean">Boolean</SelectItem>
                                <SelectItem value="array">Array</SelectItem>
                                <SelectItem value="object">Object</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Input
                            onChange={(e) => {
                              const params =
                                editingTool?.parameters ||
                                newTool.parameters ||
                                [];
                              params[index] = {
                                ...param,
                                description: e.target.value,
                              };

                              if (editingTool) {
                                setEditingTool({
                                  ...editingTool,
                                  parameters: params,
                                });
                              } else {
                                setNewTool({ ...newTool, parameters: params });
                              }
                            }}
                            placeholder="Description"
                            value={param.description}
                          />

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={param.required}
                                onCheckedChange={(checked) => {
                                  const params =
                                    editingTool?.parameters ||
                                    newTool.parameters ||
                                    [];
                                  params[index] = {
                                    ...param,
                                    required: checked,
                                  };

                                  if (editingTool) {
                                    setEditingTool({
                                      ...editingTool,
                                      parameters: params,
                                    });
                                  } else {
                                    setNewTool({
                                      ...newTool,
                                      parameters: params,
                                    });
                                  }
                                }}
                              />
                              <Label className="text-sm">Required</Label>
                            </div>

                            <Button
                              onClick={() => {
                                const params =
                                  editingTool?.parameters ||
                                  newTool.parameters ||
                                  [];
                                params.splice(index, 1);

                                if (editingTool) {
                                  setEditingTool({
                                    ...editingTool,
                                    parameters: params,
                                  });
                                } else {
                                  setNewTool({
                                    ...newTool,
                                    parameters: params,
                                  });
                                }
                              }}
                              size="sm"
                              variant="ghost"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            </TabsContent>

            <TabsContent className="mt-4 space-y-4" value="test">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Test Configuration
                  </CardTitle>
                  <CardDescription>
                    Test your tool configuration with sample data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      className="font-mono text-sm"
                      placeholder="Enter test data (JSON format)"
                      rows={6}
                    />
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Play className="mr-2 h-3 w-3" />
                        Run Test
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Copy className="mr-2 h-3 w-3" />
                        Copy cURL
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowAddDialog(false);
                setEditingTool(null);
                resetNewTool();
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={handleAddTool}>
              {editingTool ? 'Update Tool' : 'Add Tool'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AgentToolBuilder;

// Import missing icon

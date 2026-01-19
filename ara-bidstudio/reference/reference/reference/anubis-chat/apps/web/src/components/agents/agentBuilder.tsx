'use client';

import {
  BarChart3,
  Bot,
  Brain,
  Code,
  Coins,
  Database,
  Download,
  Eye,
  Image,
  RefreshCw,
  Save,
  Settings,
  Share2,
  Shield,
  Sparkles,
  Terminal,
  TestTube,
  TrendingUp,
  Upload,
  Vote,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { TooltipProvider } from '@/components/ui/tooltip';
import { err, ok, type Result } from '@/lib/types/result';
import { cn } from '@/lib/utils';
import { AgentCapabilitySelector } from './agentCapabilitySelector';
import { AgentPersonalityEditor } from './agentPersonalityEditor';
import { AgentTemplateGallery } from './agentTemplateGallery';
import { AgentTestingPanel } from './agentTestingPanel';
import { AgentToolBuilder, type Tool } from './agentToolBuilder';
import type { Agent, AgentPersonality, AgentTemplate } from './types';

// Type for the extended personality interface used by AgentPersonalityEditor
interface Personality extends AgentPersonality {
  customPrompt?: string;
  examples?: Array<{
    input: string;
    output: string;
  }>;
  creativity: number;
  formality: number;
  verbosity: number;
  humor: number;
  empathy: number;
}

// Helper function to get agent types
const getAgentTypes = () => [
  {
    value: 'general',
    label: 'General Assistant',
    icon: Bot,
    color: 'bg-gray-500',
  },
  {
    value: 'trading',
    label: 'Trading Agent',
    icon: TrendingUp,
    color: 'bg-green-500',
  },
  {
    value: 'defi',
    label: 'DeFi Specialist',
    icon: Coins,
    color: 'bg-blue-500',
  },
  { value: 'nft', label: 'NFT Expert', icon: Image, color: 'bg-purple-500' },
  { value: 'dao', label: 'DAO Manager', icon: Vote, color: 'bg-orange-500' },
  {
    value: 'portfolio',
    label: 'Portfolio Analyst',
    icon: BarChart3,
    color: 'bg-indigo-500',
  },
  {
    value: 'developer',
    label: 'Code Assistant',
    icon: Code,
    color: 'bg-pink-500',
  },
  {
    value: 'research',
    label: 'Research Agent',
    icon: Database,
    color: 'bg-teal-500',
  },
];

// Helper functions to convert between AgentPersonality and Personality
const agentPersonalityToPersonality = (
  agentPersonality: AgentPersonality
): Personality => ({
  ...agentPersonality,
  creativity: 0.7,
  formality: 0.5,
  verbosity: 0.6,
  humor: 0.3,
  empathy: 0.8,
  customPrompt: agentPersonality.customPrompts?.[0] || '',
  examples: [],
});

const personalityToAgentPersonality = (
  personality: Personality
): AgentPersonality => ({
  tone: personality.tone,
  style: personality.style,
  traits: personality.traits,
  customPrompts: personality.customPrompt
    ? [
        personality.customPrompt,
        ...(personality.customPrompts || []).filter(
          (p) => p !== personality.customPrompt
        ),
      ]
    : personality.customPrompts,
});

interface AgentBuilderProps {
  onSave?: (agent: Agent) => void;
  onCancel?: () => void;
  initialAgent?: Partial<Agent>;
}

// Helper function to create initial agent data
const createInitialAgentData = (initialAgent?: Partial<Agent>): Agent => ({
  name: initialAgent?.name || '',
  description: initialAgent?.description || '',
  avatar: initialAgent?.avatar || '',
  type: initialAgent?.type || 'general',
  personality: initialAgent?.personality || {
    tone: 'professional',
    style: 'concise',
    traits: [],
    customPrompts: [],
  },
  capabilities: initialAgent?.capabilities || [],
  tools: initialAgent?.tools || [],
  knowledge: initialAgent?.knowledge || [],
  settings: initialAgent?.settings || {
    temperature: 0.7,
    maxTokens: 2000,
    streamResponses: true,
    memoryEnabled: true,
    contextWindow: 10,
  },
  permissions: initialAgent?.permissions || {
    canExecuteTrades: false,
    maxTransactionValue: 100,
    requiresApproval: true,
    allowedChains: ['solana'],
  },
});

export function AgentBuilder({
  onSave,
  onCancel,
  initialAgent,
}: AgentBuilderProps) {
  const [activeTab, setActiveTab] = useState('basics');
  const [agentData, setAgentData] = useState<Agent>(
    createInitialAgentData(initialAgent)
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const agentTypes = getAgentTypes();

  const validateAgent = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!agentData.name) {
      newErrors.name = 'Agent name is required';
    }
    if (!agentData.description) {
      newErrors.description = 'Description is required';
    }
    if (agentData.capabilities.length === 0) {
      newErrors.capabilities = 'Select at least one capability';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to simulate save operation
  const simulateSaveOperation = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate potential failure (5% chance)
        if (Math.random() < 0.05) {
          reject(new Error('Failed to save agent. Please try again.'));
        } else {
          resolve();
        }
      }, 1000);
    });
  };

  // Helper function to handle errors with proper typing
  const handleSaveError = (error: unknown): Error => {
    if (error instanceof Error) {
      return error;
    }
    if (typeof error === 'string') {
      return new Error(error);
    }
    return new Error('An unexpected error occurred while saving the agent.');
  };

  const handleSave = async (): Promise<Result<Agent, Error>> => {
    if (!validateAgent()) {
      return err(
        new Error('Validation failed. Please check all required fields.')
      );
    }

    setIsSaving(true);

    try {
      // Simulate save operation (replace with actual API call)
      await simulateSaveOperation();

      // Call the onSave callback if provided
      onSave?.(agentData);

      setIsSaving(false);

      // Return success result with the saved agent data
      return ok(agentData);
    } catch (error) {
      setIsSaving(false);
      return err(handleSaveError(error));
    }
  };

  const getTypeIcon = (type: string) => {
    const agentType = agentTypes.find((t) => t.value === type);
    const IconComponent = agentType?.icon || Bot;
    return <IconComponent className="h-4 w-4" />;
  };

  // Header handlers
  const handlePreviewToggle = () => setPreviewMode(!previewMode);
  const handleTemplateClick = () => {
    /* Template logic */
  };
  const handleShareClick = () => {
    /* Share logic */
  };

  // Data update handlers
  const updateAgentData = (updates: Partial<Agent>) => {
    setAgentData((prev) => ({ ...prev, ...updates }));
  };

  const handleSaveClick = async () => {
    const result = await handleSave();
    if (!result.ok) {
      // Error handling is done in handleSave
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-primary">
                  <AvatarImage src={agentData.avatar} />
                  <AvatarFallback>{getTypeIcon(agentData.type)}</AvatarFallback>
                </Avatar>
                <Badge
                  className="-bottom-1 -right-1 absolute h-5 px-1"
                  variant="secondary"
                >
                  {agentData.type}
                </Badge>
              </div>
              <div>
                <h2 className="font-semibold text-xl">
                  {agentData.name || 'New Agent'}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {agentData.description || 'Configure your custom AI agent'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button onClick={handlePreviewToggle} size="icon" variant="ghost">
                <Eye className="h-4 w-4" />
              </Button>
              <Button onClick={handleTemplateClick} size="icon" variant="ghost">
                <Download className="h-4 w-4" />
              </Button>
              <Button onClick={handleShareClick} size="icon" variant="ghost">
                <Share2 className="h-4 w-4" />
              </Button>
              <Separator className="h-6" orientation="vertical" />
              <Button onClick={onCancel} variant="outline">
                Cancel
              </Button>
              <Button disabled={isSaving} onClick={handleSaveClick}>
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Agent
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs
            className="h-full"
            onValueChange={setActiveTab}
            value={activeTab}
          >
            <div className="border-b px-6">
              <TabsList className="h-12 w-full justify-start rounded-none border-0 bg-transparent p-0">
                <TabsTrigger
                  className="relative h-12 rounded-none border-transparent border-b-2 bg-transparent px-4 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  value="basics"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Basics
                  {errors.name || errors.description ? (
                    <div className="-top-1 -right-1 absolute h-2 w-2 rounded-full bg-destructive" />
                  ) : null}
                </TabsTrigger>
                <TabsTrigger
                  className="relative h-12 rounded-none border-transparent border-b-2 bg-transparent px-4 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  value="capabilities"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Capabilities
                  {errors.capabilities ? (
                    <div className="-top-1 -right-1 absolute h-2 w-2 rounded-full bg-destructive" />
                  ) : null}
                </TabsTrigger>
                <TabsTrigger
                  className="relative h-12 rounded-none border-transparent border-b-2 bg-transparent px-4 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  value="tools"
                >
                  <Terminal className="mr-2 h-4 w-4" />
                  Tools & APIs
                </TabsTrigger>
                <TabsTrigger
                  className="relative h-12 rounded-none border-transparent border-b-2 bg-transparent px-4 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  value="personality"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Personality
                </TabsTrigger>
                <TabsTrigger
                  className="relative h-12 rounded-none border-transparent border-b-2 bg-transparent px-4 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  value="knowledge"
                >
                  <Brain className="mr-2 h-4 w-4" />
                  Knowledge Base
                </TabsTrigger>
                <TabsTrigger
                  className="relative h-12 rounded-none border-transparent border-b-2 bg-transparent px-4 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  value="permissions"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Permissions
                </TabsTrigger>
                <TabsTrigger
                  className="relative h-12 rounded-none border-transparent border-b-2 bg-transparent px-4 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  value="testing"
                >
                  <TestTube className="mr-2 h-4 w-4" />
                  Test
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[calc(100%-3rem)]">
              <div className="p-6">
                {/* Basics Tab */}
                <TabsContent className="mt-0 space-y-6" value="basics">
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>
                        Define your agent's identity and purpose
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">Agent Name *</Label>
                          <Input
                            className={errors.name ? 'border-destructive' : ''}
                            id="name"
                            onChange={(e) =>
                              updateAgentData({ name: e.target.value })
                            }
                            placeholder="e.g., Trading Pro, DeFi Helper"
                            value={agentData.name}
                          />
                          {errors.name && (
                            <p className="text-destructive text-sm">
                              {errors.name}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="type">Agent Type</Label>
                          <Select
                            onValueChange={(value) =>
                              updateAgentData({ type: value })
                            }
                            value={agentData.type}
                          >
                            <SelectTrigger id="type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {agentTypes.map((type) => {
                                const TypeIcon = type.icon;
                                return (
                                  <SelectItem
                                    key={type.value}
                                    value={type.value}
                                  >
                                    <div className="flex items-center">
                                      <TypeIcon className="mr-2 h-4 w-4" />
                                      {type.label}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          className={cn(
                            'min-h-[100px]',
                            errors.description ? 'border-destructive' : ''
                          )}
                          id="description"
                          onChange={(e) =>
                            updateAgentData({ description: e.target.value })
                          }
                          placeholder="Describe what your agent does and its key capabilities..."
                          value={agentData.description}
                        />
                        {errors.description && (
                          <p className="text-destructive text-sm">
                            {errors.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="avatar">Avatar URL</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="avatar"
                            onChange={(e) =>
                              updateAgentData({ avatar: e.target.value })
                            }
                            placeholder="https://example.com/avatar.png"
                            value={agentData.avatar}
                          />
                          <Button size="icon" variant="outline">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">Quick Templates</h4>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          <AgentTemplateGallery
                            onSelectTemplate={(template: AgentTemplate) => {
                              updateAgentData(template.config);
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Capabilities Tab */}
                <TabsContent className="mt-0 space-y-6" value="capabilities">
                  <Card>
                    <CardHeader>
                      <CardTitle>Agent Capabilities</CardTitle>
                      <CardDescription>
                        Select what your agent can do
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AgentCapabilitySelector
                        onChange={(capabilities) =>
                          updateAgentData({ capabilities })
                        }
                        selected={agentData.capabilities}
                      />
                      {errors.capabilities && (
                        <p className="mt-2 text-destructive text-sm">
                          {errors.capabilities}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tools Tab */}
                <TabsContent className="mt-0 space-y-6" value="tools">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tools & API Integrations</CardTitle>
                      <CardDescription>
                        Configure external tools and APIs your agent can use
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AgentToolBuilder
                        onChange={(tools) =>
                          updateAgentData({ tools: tools as Agent['tools'] })
                        }
                        tools={agentData.tools as Tool[]}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Personality Tab */}
                <TabsContent className="mt-0 space-y-6" value="personality">
                  <Card>
                    <CardHeader>
                      <CardTitle>Agent Personality</CardTitle>
                      <CardDescription>
                        Define how your agent communicates
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AgentPersonalityEditor
                        onChange={(personality) =>
                          updateAgentData({
                            personality:
                              personalityToAgentPersonality(personality),
                          })
                        }
                        personality={agentPersonalityToPersonality(
                          agentData.personality
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Knowledge Base Tab */}
                <TabsContent className="mt-0 space-y-6" value="knowledge">
                  <Card>
                    <CardHeader>
                      <CardTitle>Knowledge Base</CardTitle>
                      <CardDescription>
                        Upload documents and data for your agent to reference
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-lg border-2 border-dashed p-8 text-center">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 font-medium text-lg">
                          Drop files here
                        </h3>
                        <p className="mt-2 text-muted-foreground text-sm">
                          Support for PDF, TXT, MD, JSON files
                        </p>
                        <Button className="mt-4" variant="outline">
                          <Upload className="mr-2 h-4 w-4" />
                          Browse Files
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Permissions Tab */}
                <TabsContent className="mt-0 space-y-6" value="permissions">
                  <Card>
                    <CardHeader>
                      <CardTitle>Security & Permissions</CardTitle>
                      <CardDescription>
                        Control what your agent is allowed to do
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Execute Trades</Label>
                            <p className="text-muted-foreground text-sm">
                              Allow agent to execute blockchain transactions
                            </p>
                          </div>
                          <Switch
                            checked={agentData.permissions.canExecuteTrades}
                            onCheckedChange={(checked) =>
                              updateAgentData({
                                permissions: {
                                  ...agentData.permissions,
                                  canExecuteTrades: checked,
                                },
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Require Approval</Label>
                            <p className="text-muted-foreground text-sm">
                              Require user confirmation for sensitive actions
                            </p>
                          </div>
                          <Switch
                            checked={agentData.permissions.requiresApproval}
                            onCheckedChange={(checked) =>
                              updateAgentData({
                                permissions: {
                                  ...agentData.permissions,
                                  requiresApproval: checked,
                                },
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Maximum Transaction Value (SOL)</Label>
                          <div className="flex items-center space-x-4">
                            <Slider
                              className="flex-1"
                              max={1000}
                              onValueChange={([value]) =>
                                updateAgentData({
                                  permissions: {
                                    ...agentData.permissions,
                                    maxTransactionValue: value,
                                  },
                                })
                              }
                              step={10}
                              value={[
                                agentData.permissions.maxTransactionValue,
                              ]}
                            />
                            <span className="w-20 text-right font-mono text-sm">
                              {agentData.permissions.maxTransactionValue} SOL
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Testing Tab */}
                <TabsContent className="mt-0 space-y-6" value="testing">
                  <AgentTestingPanel agent={agentData} />
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default AgentBuilder;

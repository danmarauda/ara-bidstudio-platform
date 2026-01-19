'use client';

import { api } from '@convex/_generated/api';
import { useForm } from '@tanstack/react-form';
import { useMutation } from 'convex/react';
import { AlertTriangle, ArrowLeft, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  useAuthContext,
  useSubscriptionStatus,
} from '@/components/providers/auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Removed unused Select imports
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

// =============================================================================
// Configuration
// =============================================================================

const AGENT_CONFIG = {
  templates: [
    { value: 'general', label: 'General Assistant' },
    { value: 'research', label: 'Research Specialist' },
    { value: 'analysis', label: 'Data Analyst' },
    { value: 'blockchain', label: 'Blockchain Assistant' },
    { value: 'custom', label: 'Custom Agent' },
  ] as const,
  defaults: {
    template: 'custom' as const,
    temperature: 0.7,
    maxTokens: 4096,
    maxSteps: 10,
    enableMCPTools: false,
    tools: [] as string[],
    mcpServers: [
      {
        name: 'context7',
        enabled: false,
        label: 'Context7 - Library Documentation',
        description:
          'Access to library docs, code examples, and best practices',
      },
      {
        name: 'solana',
        enabled: false,
        label: 'Solana Developer Assistant',
        description:
          'Expert guidance for Solana development, Anchor framework, and real-time documentation search',
      },
    ],
  },
} as const;

// =============================================================================
// Validation Schema
// =============================================================================

const createAgentFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .trim()
    .optional()
    .default(''),
  systemPrompt: z
    .string()
    .max(2000, 'System prompt must be 2000 characters or less')
    .trim()
    .optional()
    .default(''),
  template: z
    .enum(['general', 'research', 'analysis', 'blockchain', 'custom'])
    .default(AGENT_CONFIG.defaults.template),
  temperature: z
    .number()
    .min(0, 'Temperature must be between 0 and 2')
    .max(2, 'Temperature must be between 0 and 2')
    .default(AGENT_CONFIG.defaults.temperature),
  maxTokens: z
    .number()
    .int('Max tokens must be a whole number')
    .min(1, 'Max tokens must be at least 1')
    .max(128_000, 'Max tokens cannot exceed 128,000')
    .default(AGENT_CONFIG.defaults.maxTokens),
  maxSteps: z
    .number()
    .int('Max steps must be a whole number')
    .min(1, 'Max steps must be at least 1')
    .max(50, 'Max steps cannot exceed 50')
    .default(AGENT_CONFIG.defaults.maxSteps),
  enableMCPTools: z.boolean().default(AGENT_CONFIG.defaults.enableMCPTools),
  mcpServers: z
    .array(
      z.object({
        name: z.string(),
        enabled: z.boolean(),
        config: z.object({}).optional(),
      })
    )
    .optional(),
});

type CreateAgentFormData = z.infer<typeof createAgentFormSchema>;

// =============================================================================
// API Submission Handler
// =============================================================================

// Removed unused CreateAgentError interface

export default function NewAgentPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const subscription = useSubscriptionStatus();
  const createAgentMutation = useMutation(api.agents.create);

  // Check if user has reached agent creation limits
  let _canCreateAgent = false;
  if (subscription) {
    if (subscription.tier === 'free') {
      _canCreateAgent = true;
    } else if (subscription.tier === 'pro') {
      _canCreateAgent = true;
    } else if (subscription.tier === 'pro_plus') {
      _canCreateAgent = true;
    }
  }

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      systemPrompt: '',
      template: AGENT_CONFIG.defaults.template,
      temperature: AGENT_CONFIG.defaults.temperature,
      maxTokens: AGENT_CONFIG.defaults.maxTokens,
      maxSteps: AGENT_CONFIG.defaults.maxSteps,
      enableMCPTools: AGENT_CONFIG.defaults.enableMCPTools,
      mcpServers: AGENT_CONFIG.defaults.mcpServers.map((s) => ({
        name: s.name,
        enabled: s.enabled,
        config: {},
      })),
    } as CreateAgentFormData,
    onSubmit: async ({ value }) => {
      const validation = validateForm(value);
      if (!validation.ok) {
        return;
      }
      if (!user?.walletAddress) {
        toast.error('Please connect your wallet first');
        return;
      }
      try {
        const agentData = buildAgentData(validation.value, user.walletAddress);
        await createAgentMutation(agentData);
        toast.success('Agent created successfully!');
        router.push('/agents');
      } catch (error) {
        const err = error as Error;
        toast.error(err.message || 'Failed to create agent');
      }
    },
  });

  if (!subscription) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="font-semibold text-xl">Loading subscription...</h2>
          <p className="text-muted-foreground">
            Please wait while we load your subscription details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-b from-primary/5 dark:from-primary/10">
      {/* Full-width header */}
      <div className="w-full p-4 md:p-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-2 flex items-center gap-2">
            <Button
              onClick={() => router.push('/agents')}
              size="sm"
              variant="ghost"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Agents
            </Button>
          </div>
          <h1 className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text font-semibold text-2xl text-transparent sm:text-3xl">
            Create AI Agent
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Configure your custom AI agent
          </p>
          <div className="mt-2 flex items-center gap-3">
            <Badge
              className="gap-1"
              variant={subscription.tier === 'free' ? 'secondary' : 'default'}
            >
              <Crown className="h-3 w-3" />
              {subscription.tier} Plan
            </Badge>
            <p className="text-muted-foreground text-sm">
              {subscription.tier === 'free' &&
                'Access to basic models and features'}
              {subscription.tier === 'pro' &&
                'Access to premium models with limits'}
              {subscription.tier === 'pro_plus' &&
                'Full access to all models and features'}
            </p>
          </div>
        </div>
      </div>

      {/* Constrained content */}
      <div className="mx-auto w-full max-w-6xl space-y-3 p-3 sm:space-y-4 sm:p-4 md:p-6">
        {/* Tier-specific alerts */}
        {subscription.tier === 'free' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Free tier agents are limited to basic models. Upgrade to Pro or
              Pro+ to access premium AI models.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <div className="space-y-2">
              <h2 className="font-semibold text-lg">Agent Details</h2>
              <p className="text-muted-foreground text-sm">
                Basic information and behavior
              </p>
            </div>
            <Separator className="my-4" />
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
            >
              {/* Name Field */}
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => {
                    const result = z
                      .string()
                      .min(1, 'Name is required')
                      .max(100, 'Name must be 100 characters or less')
                      .safeParse(value);
                    return result.success
                      ? undefined
                      : result.error.issues[0].message;
                  },
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor={field.name}>
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      aria-describedby={
                        field.state.meta.errors.length > 0
                          ? `${field.name}-error`
                          : undefined
                      }
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter agent name..."
                      required
                      value={field.state.value}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p
                        className="mt-1 text-red-600 text-sm"
                        id={`${field.name}-error`}
                      >
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Description Field */}
              <form.Field
                name="description"
                validators={{
                  onChange: ({ value }) => {
                    const result = z
                      .string()
                      .max(500, 'Description must be 500 characters or less')
                      .safeParse(value);
                    return result.success
                      ? undefined
                      : result.error.issues[0].message;
                  },
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor={field.name}>Description</Label>
                    <Input
                      aria-describedby={
                        field.state.meta.errors.length > 0
                          ? `${field.name}-error`
                          : undefined
                      }
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Brief description of your agent (optional)..."
                      value={field.state.value}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p
                        className="mt-1 text-red-600 text-sm"
                        id={`${field.name}-error`}
                      >
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* System Prompt Field */}
              <form.Field
                name="systemPrompt"
                validators={{
                  onChange: ({ value }) => {
                    const result = z
                      .string()
                      .max(
                        2000,
                        'System prompt must be 2000 characters or less'
                      )
                      .safeParse(value);
                    return result.success
                      ? undefined
                      : result.error.issues[0].message;
                  },
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor={field.name}>System Prompt</Label>
                    <Textarea
                      aria-describedby={
                        field.state.meta.errors.length > 0
                          ? `${field.name}-error`
                          : undefined
                      }
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Define your agent's behavior and personality (optional)..."
                      rows={6}
                      value={field.state.value}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p
                        className="mt-1 text-red-600 text-sm"
                        id={`${field.name}-error`}
                      >
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <Separator className="my-2" />
              <div className="space-y-2">
                <h2 className="font-semibold text-lg">Agent Settings</h2>
                <p className="text-muted-foreground text-sm">
                  Configure generation parameters
                </p>
              </div>

              {/* Temperature Slider */}
              <form.Field name="temperature">
                {(field) => (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={field.name}>Temperature</Label>
                      <span className="text-muted-foreground text-sm">
                        {field.state.value}
                      </span>
                    </div>
                    <Input
                      className="w-full"
                      id={field.name}
                      max={2}
                      min={0}
                      name={field.name}
                      onChange={(e) =>
                        field.handleChange(
                          Number.parseFloat(
                            e.target.value
                          ) as CreateAgentFormData['temperature']
                        )
                      }
                      step={0.1}
                      type="range"
                      value={field.state.value}
                    />
                    <p className="text-muted-foreground text-xs">
                      Controls randomness: 0 = focused, 2 = creative
                    </p>
                  </div>
                )}
              </form.Field>

              {/* Max Tokens */}
              <form.Field name="maxTokens">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Max Tokens</Label>
                    <Input
                      id={field.name}
                      max={128_000}
                      min={1}
                      name={field.name}
                      onChange={(e) =>
                        field.handleChange(
                          Number.parseInt(
                            e.target.value,
                            10
                          ) as CreateAgentFormData['maxTokens']
                        )
                      }
                      placeholder="4096"
                      type="number"
                      value={field.state.value}
                    />
                    <p className="text-muted-foreground text-xs">
                      Maximum response length (1 token ≈ 4 characters)
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="mt-1 text-red-600 text-sm">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* MCP Server Configuration - Temporarily disabled */}
              {/* <div className="space-y-4">
            <div>
              <Label>MCP Server Tools</Label>
              <p className="mb-3 text-muted-foreground text-sm">
                Enable additional AI tools and capabilities for your agent
              </p>
              <div className="space-y-3">
                {AGENT_CONFIG.defaults.mcpServers.map((server, index) => (
                  <form.Field key={server.name} name={`mcpServers`}>
                    {(field) => {
                      const mcpServers = field.state.value || [];
                      const serverState = mcpServers[index] || {
                        name: server.name,
                        enabled: false,
                        config: {},
                      };

                      return (
                        <Card className="p-4">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={serverState.enabled}
                              className="mt-1"
                              id={`mcp-${server.name}`}
                              onCheckedChange={(checked) => {
                                const newServers = [...mcpServers];
                                newServers[index] = {
                                  ...serverState,
                                  enabled: checked as boolean,
                                };
                                field.handleChange(newServers);
                              }}
                            />
                            <div className="flex-1">
                              <label
                                className="cursor-pointer font-medium text-sm"
                                htmlFor={`mcp-${server.name}`}
                              >
                                {server.label}
                              </label>
                              <p className="mt-1 text-muted-foreground text-xs">
                                {server.description}
                              </p>
                              {server.name === 'context7' && (
                                <div className="mt-2 rounded-lg bg-blue-50 p-2 text-xs dark:bg-blue-950">
                                  <strong>Context7 Features:</strong>
                                  <ul className="ml-4 mt-1 list-disc">
                                    <li>Access to 50,000+ library docs</li>
                                    <li>Real-time, version-specific code examples</li>
                                    <li>Best practices and patterns</li>
                                    <li>Framework-specific guidance</li>
                                  </ul>
                                </div>
                              )}
                              {server.name === 'solana' && (
                                <div className="mt-2 rounded-lg bg-purple-50 p-2 text-xs dark:bg-purple-950">
                                  <strong>Solana Developer Tools:</strong>
                                  <ul className="ml-4 mt-1 list-disc">
                                    <li>Solana expert for development questions</li>
                                    <li>Documentation search with RAG</li>
                                    <li>Anchor framework specialist</li>
                                    <li>Real-time docs updates</li>
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    }}
                  </form.Field>
                ))}
              </div>
            </div>
          </div> */}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button disabled={!canSubmit || isSubmitting} type="submit">
                      {isSubmitting ? 'Creating...' : 'Create Agent'}
                    </Button>
                  )}
                </form.Subscribe>
                <Button
                  onClick={() => router.back()}
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="p-5">
              <div className="space-y-1">
                <h3 className="font-medium text-sm">Tips for better agents</h3>
                <p className="text-muted-foreground text-xs">
                  Quick guidelines
                </p>
              </div>
              <Separator className="my-3" />
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground text-xs">
                <li>Keep names short and descriptive</li>
                <li>Start with a clear system prompt</li>
                <li>Use lower temperature for reliability</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helpers extracted to reduce onSubmit complexity
function validateForm(value: CreateAgentFormData) {
  const validation = createAgentFormSchema.safeParse(value);
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    for (const [field, messages] of Object.entries(errors)) {
      if (messages) {
        toast.error(`${field}: ${messages[0]}`);
      }
    }
    return { ok: false as const };
  }
  return { ok: true as const, value: validation.data };
}

function buildAgentData(data: CreateAgentFormData, createdBy: string) {
  const mapTemplateToType = (
    t: CreateAgentFormData['template']
  ):
    | 'general'
    | 'custom'
    | 'trading'
    | 'defi'
    | 'nft'
    | 'dao'
    | 'portfolio' => {
    if (t === 'custom') {
      return 'custom';
    }
    if (t === 'blockchain') {
      return 'trading';
    }
    if (t === 'analysis') {
      return 'portfolio';
    }
    if (t === 'research') {
      return 'general';
    }
    return 'general';
  };

  return {
    name: data.name,
    type: mapTemplateToType(data.template),
    description: data.description || '',
    systemPrompt: data.systemPrompt || 'You are a helpful AI assistant.',
    capabilities: AGENT_CONFIG.defaults.tools,
    temperature: data.temperature,
    maxTokens: data.maxTokens,
    maxSteps: data.maxSteps,
    createdBy,
    tools: AGENT_CONFIG.defaults.tools,
    mcpServers: data.mcpServers?.filter((s) => s.enabled),
  };
}

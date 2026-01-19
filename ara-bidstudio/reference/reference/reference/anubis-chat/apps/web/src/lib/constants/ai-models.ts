/**
 * AI Model Configurations
 * Updated: August 2025
 */

export interface AIModel {
  id: string;
  name: string;
  provider: 'openrouter' | 'openai' | 'anthropic' | 'google';
  description: string;
  contextWindow: number;
  maxOutput?: number;
  pricing: {
    input: number; // per 1M tokens
    output: number; // per 1M tokens
  };
  capabilities: string[];
  speed: 'fast' | 'medium' | 'slow';
  intelligence: 'basic' | 'advanced' | 'expert' | 'frontier';
  released?: string;
  default?: boolean;
}

function createOpenRouterModel(params: {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  maxOutput: number;
  capabilities: string[];
  speed: AIModel['speed'];
  intelligence: AIModel['intelligence'];
  default?: boolean;
}): AIModel {
  return {
    id: params.id,
    name: params.name,
    provider: 'openrouter',
    description: params.description,
    contextWindow: params.contextWindow,
    maxOutput: params.maxOutput,
    pricing: { input: 0, output: 0 },
    capabilities: params.capabilities,
    speed: params.speed,
    intelligence: params.intelligence,
    default: params.default,
  };
}

export const AI_MODELS: AIModel[] = [
  // GPT-5 Nano - Default flagship nano model
  {
    id: 'gpt-5-nano',
    name: 'GPT-5 Nano',
    provider: 'openai',
    description: 'Ultra-efficient nano model with GPT-5 intelligence',
    contextWindow: 128_000,
    maxOutput: 4096,
    pricing: { input: 0.5, output: 1.5 },
    capabilities: ['general', 'coding', 'reasoning', 'analysis'],
    speed: 'fast',
    intelligence: 'advanced',
    released: 'January 2025',
    default: true,
  },
  // GPT-OSS-20B - Free model
  createOpenRouterModel({
    id: 'openrouter/openai/gpt-oss-20b:free',
    name: 'GPT-OSS-20B (Free) – OpenRouter',
    description: 'OpenAI GPT-OSS-20B open-weight, free tier via OpenRouter',
    contextWindow: 128_000,
    maxOutput: 4096,
    capabilities: ['coding', 'reasoning', 'general'],
    speed: 'fast',
    intelligence: 'advanced',
    default: false,
  }),
  createOpenRouterModel({
    id: 'openrouter/z-ai/glm-4.5-air:free',
    name: 'GLM-4.5-Air (Free) – OpenRouter',
    description: 'Zhipu AI GLM-4.5-Air free tier via OpenRouter',
    contextWindow: 128_000,
    maxOutput: 8192,
    capabilities: ['reasoning', 'coding', 'tools'],
    speed: 'fast',
    intelligence: 'advanced',
  }),
  createOpenRouterModel({
    id: 'openrouter/qwen/qwen3-coder:free',
    name: 'Qwen3-Coder (Free) – OpenRouter',
    description: 'Qwen3-Coder free tier via OpenRouter, optimized for coding',
    contextWindow: 128_000,
    maxOutput: 8192,
    capabilities: ['coding', 'analysis'],
    speed: 'fast',
    intelligence: 'advanced',
  }),
  createOpenRouterModel({
    id: 'openrouter/moonshotai/kimi-k2:free',
    name: 'Kimi K2 (Free) – OpenRouter',
    description: 'Moonshot AI Kimi K2 free tier via OpenRouter',
    contextWindow: 128_000,
    maxOutput: 8192,
    capabilities: ['agentic', 'coding', 'reasoning'],
    speed: 'medium',
    intelligence: 'advanced',
  }),
  // GPT-OSS-120B – Premium via OpenRouter (Cerebras provider)
  {
    id: 'openrouter/openai/gpt-oss-120b',
    name: 'GPT-OSS-120B (Cerebras) – OpenRouter',
    provider: 'openrouter',
    description:
      'OpenAI GPT-OSS-120B via OpenRouter using Cerebras provider for high-throughput reasoning',
    contextWindow: 32_768,
    maxOutput: 8192,
    pricing: { input: 0.073, output: 0.29 },
    capabilities: ['reasoning', 'coding', 'analysis', 'tools'],
    speed: 'medium',
    intelligence: 'frontier',
    released: 'August 2025',
  },
  // OpenAI Models (August 2025)
  {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'openai',
    description:
      'Latest flagship model with unified reasoning and generation capabilities',
    contextWindow: 128_000,
    maxOutput: 16_384,
    pricing: { input: 30, output: 120 },
    capabilities: [
      'coding',
      'reasoning',
      'creative',
      'analysis',
      'vision',
      'tools',
    ],
    speed: 'medium',
    intelligence: 'frontier',
    released: 'August 2025',
    default: false,
  },
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    description:
      'Smaller, faster version of GPT-5 with excellent cost-performance ratio',
    contextWindow: 128_000,
    maxOutput: 8192,
    pricing: { input: 5, output: 20 },
    capabilities: [
      'coding',
      'reasoning',
      'creative',
      'analysis',
      'general',
      'tools',
    ],
    speed: 'fast',
    intelligence: 'expert',
    released: 'August 2025',
    default: false,
  },
  {
    id: 'o4-mini',
    name: 'OpenAI o4-mini',
    provider: 'openai',
    description: 'Fast, cost-efficient reasoning model',
    contextWindow: 128_000,
    maxOutput: 16_384,
    pricing: { input: 3, output: 12 },
    capabilities: ['reasoning', 'coding', 'math'],
    speed: 'fast',
    intelligence: 'expert', // Changed to expert to make it premium
    released: '2025',
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    provider: 'openai',
    description: 'Compact and efficient model with enhanced reasoning',
    contextWindow: 128_000,
    maxOutput: 4096,
    pricing: { input: 0.4, output: 1.6 },
    capabilities: ['coding', 'analysis', 'reasoning'],
    speed: 'fast',
    intelligence: 'advanced',
    released: '2025',
  },

  // Anthropic Models (August 2025) - COMMENTED OUT FOR NOW
  /*
  {
    id: 'claude-opus-4.1',
    name: 'Claude Opus 4.1',
    provider: 'anthropic',
    description: "World's best coding model with sustained performance",
    contextWindow: 200_000,
    maxOutput: 8192,
    pricing: { input: 15, output: 75 },
    capabilities: ['coding', 'agent-workflows', 'reasoning', 'analysis'],
    speed: 'medium',
    intelligence: 'frontier',
    released: 'August 5, 2025',
  },
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    description: 'Excellent coding with fast responses',
    contextWindow: 200_000,
    maxOutput: 8192,
    pricing: { input: 3, output: 15 },
    capabilities: ['coding', 'reasoning', 'creative', 'analysis'],
    speed: 'fast',
    intelligence: 'expert',
    released: 'May 2025',
  },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Fast, intelligent, and cost-effective',
    contextWindow: 200_000,
    maxOutput: 8192,
    pricing: { input: 3, output: 15 },
    capabilities: ['general', 'coding', 'analysis', 'creative'],
    speed: 'fast',
    intelligence: 'advanced',
  },
  {
    id: 'claude-3.5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    description: 'Fastest Claude model for simple tasks',
    contextWindow: 200_000,
    maxOutput: 4096,
    pricing: { input: 0.25, output: 1.25 },
    capabilities: ['general', 'quick-tasks'],
    speed: 'fast',
    intelligence: 'basic',
  },
  */

  // Google Models (August 2025)
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    description: 'Most intelligent model with thinking capabilities',
    contextWindow: 1_000_000,
    maxOutput: 8192,
    pricing: { input: 7, output: 21 },
    capabilities: ['thinking', 'reasoning', 'analysis', 'multimodal'],
    speed: 'slow',
    intelligence: 'frontier',
    released: 'March 2025',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    description: 'Fast thinking model with excellent performance',
    contextWindow: 1_000_000,
    maxOutput: 8192,
    pricing: { input: 0.3, output: 1.2 },
    capabilities: ['thinking', 'reasoning', 'multimodal'],
    speed: 'fast',
    intelligence: 'expert',
    released: '2025',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    provider: 'google',
    description: 'Fastest and lowest cost Gemini model',
    contextWindow: 1_000_000,
    maxOutput: 8192,
    pricing: { input: 0.1, output: 0.4 },
    capabilities: ['general', 'quick-tasks'],
    speed: 'fast',
    intelligence: 'advanced',
    released: '2025',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    description: 'Superior speed with native tool use',
    contextWindow: 1_000_000,
    maxOutput: 8192,
    pricing: { input: 0.15, output: 0.6 },
    capabilities: ['tools', 'multimodal', 'general'],
    speed: 'fast',
    intelligence: 'advanced',
  },
];

export const DEFAULT_MODEL = AI_MODELS.find((m) => m.default) || AI_MODELS[0];

export const getModelById = (id: string): AIModel | undefined => {
  return AI_MODELS.find((model) => model.id === id);
};

export const getModelsByProvider = (
  provider: 'openai' | 'anthropic' | 'google' | 'openrouter'
): AIModel[] => {
  return AI_MODELS.filter((model) => model.provider === provider);
};

export const getModelsByIntelligence = (
  level: AIModel['intelligence']
): AIModel[] => {
  return AI_MODELS.filter((model) => model.intelligence === level);
};

export const formatTokenPrice = (
  tokens: number,
  pricePerMillion: number
): string => {
  const cost = (tokens / 1_000_000) * pricePerMillion;
  return `$${cost.toFixed(4)}`;
};

// Determine if a model is premium based on pricing and intelligence
export const isPremiumModel = (model: AIModel): boolean => {
  // Premium models are expensive models (>$5 input or intelligence >= expert)
  return (
    model.pricing.input > 5 ||
    model.intelligence === 'frontier' ||
    model.intelligence === 'expert' ||
    // Specific high-value models
    ['gpt-4.1-mini', 'gpt-5-mini'].includes(model.id)
  );
};

// Get models available for a specific subscription tier
export const getModelsForTier = (
  tier: 'free' | 'pro' | 'pro_plus'
): AIModel[] => {
  if (tier === 'free') {
    // Free tier only gets basic, cheap models
    return AI_MODELS.filter(
      (model) =>
        !isPremiumModel(model) &&
        (model.pricing.input <= 1 || model.intelligence === 'basic')
    );
  }
  if (tier === 'pro') {
    // Pro tier gets all models but with premium usage limits
    return AI_MODELS;
  }
  // Pro+ gets unlimited access to all models
  return AI_MODELS;
};

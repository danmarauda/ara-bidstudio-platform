'use client';

import { Brain, Cpu, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AI_MODELS, type AIModel } from '@/lib/constants/ai-models';

export type ProviderFilter =
  | 'all'
  | 'openai'
  // | 'anthropic'  // DISABLED FOR NOW
  | 'google'
  | 'openrouter';

interface ProviderFilterProps {
  selected: ProviderFilter;
  onSelect: (provider: ProviderFilter) => void;
  availableCount?: number;
  className?: string;
}

const getProviderIcon = (provider: AIModel['provider']) => {
  switch (provider) {
    case 'openai':
      return <Sparkles className="h-3 w-3" />;
    case 'anthropic':
      return <Brain className="h-3 w-3" />;
    case 'google':
      return <Cpu className="h-3 w-3" />;
    case 'openrouter':
      return <Sparkles className="h-3 w-3" />;
  }
};

export function ProviderFilter({
  selected,
  onSelect,
  availableCount,
  className,
}: ProviderFilterProps) {
  const providers = [
    {
      value: 'all' as const,
      label: 'All Providers',
      count: availableCount || AI_MODELS.length,
    },
    {
      value: 'openrouter' as const,
      label: 'OpenRouter',
      count: AI_MODELS.filter((m) => m.provider === 'openrouter').length,
    },
    {
      value: 'openai' as const,
      label: 'OpenAI',
      count: AI_MODELS.filter((m) => m.provider === 'openai').length,
    },
    // Anthropic disabled for now
    /*
    {
      value: 'anthropic' as const,
      label: 'Anthropic',
      count: AI_MODELS.filter((m) => m.provider === 'anthropic').length,
    },
    */
    {
      value: 'google' as const,
      label: 'Google',
      count: AI_MODELS.filter((m) => m.provider === 'google').length,
    },
  ];

  return (
    <div
      className={`flex flex-wrap gap-2 rounded-lg bg-muted p-1 ${className}`}
    >
      {providers.map((provider) => (
        <Button
          className="flex items-center gap-1.5"
          key={provider.value}
          onClick={() => onSelect(provider.value)}
          size="sm"
          variant={selected === provider.value ? 'default' : 'ghost'}
        >
          {provider.value !== 'all' &&
            getProviderIcon(provider.value as AIModel['provider'])}
          <span>{provider.label}</span>
          <Badge className="px-1.5 text-xs" variant="secondary">
            {provider.count}
          </Badge>
        </Button>
      ))}
    </div>
  );
}

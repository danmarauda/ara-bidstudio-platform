'use client';

import { Brain, Check, Cpu, Lock, Sparkles, Zap } from 'lucide-react';
import {
  useCanUsePremiumModel,
  useSubscriptionStatus,
} from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type AIModel, isPremiumModel } from '@/lib/constants/ai-models';
import { cn } from '@/lib/utils';

interface ModelCardProps {
  model: AIModel;
  isSelected?: boolean;
  onClick: (model: AIModel) => void;
  className?: string;
  compact?: boolean;
}

const getProviderIcon = (provider: AIModel['provider']) => {
  switch (provider) {
    case 'openai':
      return <Sparkles className="h-3 w-3" />;
    // case 'anthropic':  // DISABLED FOR NOW
    //   return <Brain className="h-3 w-3" />;
    case 'google':
      return <Cpu className="h-3 w-3" />;
    case 'openrouter':
      return <Sparkles className="h-3 w-3" />;
    default:
      return <Brain className="h-3 w-3" />; // fallback icon
  }
};

const getIntelligenceBadge = (intelligence: AIModel['intelligence']) => {
  const variants: Record<AIModel['intelligence'], string> = {
    basic: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    advanced: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    expert:
      'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    frontier: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  };

  // Shortened labels
  const shortLabels: Record<AIModel['intelligence'], string> = {
    basic: 'Basic',
    advanced: 'Adv',
    expert: 'Expert',
    frontier: 'Top',
  };

  return (
    <Badge
      className={cn('border-0 px-1 py-0 text-[10px]', variants[intelligence])}
      variant="outline"
    >
      {shortLabels[intelligence]}
    </Badge>
  );
};

const getSpeedIcon = (speed: AIModel['speed']) => {
  switch (speed) {
    case 'fast':
      return <Zap className="h-2.5 w-2.5 text-green-500" />;
    case 'medium':
      return <Zap className="h-2.5 w-2.5 text-yellow-500" />;
    case 'slow':
      return <Zap className="h-2.5 w-2.5 text-orange-500" />;
  }
};

export function ModelCard({
  model,
  isSelected = false,
  onClick,
  className,
  compact = false,
}: ModelCardProps) {
  const subscription = useSubscriptionStatus();
  const canUsePremium = useCanUsePremiumModel();

  // Check if a model is accessible to current user
  const isModelAccessible = (model: AIModel) => {
    if (subscription?.tier === 'free') {
      return !isPremiumModel(model);
    }
    if (subscription?.tier === 'pro' && isPremiumModel(model)) {
      return canUsePremium;
    }
    return true;
  };

  // Get tier badge for model (Premium, Standard, Free)
  const getTierBadge = (model: AIModel) => {
    // Determine tier based on model pricing and capabilities
    const isPremium = isPremiumModel(model);
    const isFree = model.pricing.input === 0 && model.pricing.output === 0;

    let tier: 'Free' | 'Standard' | 'Premium';
    let badgeClass: string;
    let icon: React.ReactNode = null;

    if (isFree) {
      tier = 'Free';
      badgeClass =
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    } else if (isPremium) {
      tier = 'Premium';
      badgeClass =
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      icon = <Sparkles className="h-2.5 w-2.5" />;
    } else {
      tier = 'Standard';
      badgeClass =
        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }

    // Show lock icon if not accessible
    if (!isModelAccessible(model)) {
      icon = <Lock className="h-2.5 w-2.5" />;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge
              className={cn(
                'gap-0.5 px-1 py-0 font-medium text-[10px]',
                badgeClass
              )}
            >
              {icon}
              {tier}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isModelAccessible(model)
                ? `${tier} tier model`
                : subscription?.tier === 'free'
                  ? 'Requires Pro or Pro+ subscription'
                  : 'Premium message quota exhausted'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const accessible = isModelAccessible(model);

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-md',
        isSelected && 'border-primary shadow-md ring-1 ring-primary',
        !accessible && 'cursor-not-allowed opacity-60',
        'min-h-[80px] border border-border/50',
        className
      )}
      onClick={() => {
        if (accessible) {
          onClick(model);
        }
      }}
    >
      <CardContent className="p-2">
        {/* Header with model name and selection indicator */}
        <div className="mb-1.5 flex items-start justify-between gap-1">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <div className="flex-shrink-0">
              {getProviderIcon(model.provider)}
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="truncate font-semibold text-xs leading-tight"
                title={model.name}
              >
                {model.name
                  .replace(' – OpenRouter', '')
                  .replace(' – ', ' ')
                  .replace(' (Free)', '')}
              </h3>
            </div>
          </div>
          {isSelected && (
            <Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
          )}
        </div>

        {/* Badges row */}
        <div className="mb-1.5 flex flex-wrap items-center gap-1">
          {getTierBadge(model)}
          {getIntelligenceBadge(model.intelligence)}
          <div className="flex items-center">{getSpeedIcon(model.speed)}</div>
          {model.default && (
            <Badge className="px-1 py-0 text-[10px]" variant="secondary">
              Default
            </Badge>
          )}
        </div>

        {/* Description - condensed */}
        <p className="mb-1.5 line-clamp-2 text-[10px] text-muted-foreground leading-snug">
          {model.description}
        </p>

        {/* Bottom info */}
        <div className="space-y-1">
          {/* Main capabilities - limit to 2 most important */}
          <div className="flex flex-wrap gap-0.5">
            {model.capabilities.slice(0, 2).map((cap) => (
              <Badge
                className="h-3.5 px-1 py-0 text-[9px]"
                key={cap}
                variant="outline"
              >
                {cap}
              </Badge>
            ))}
            {model.capabilities.length > 2 && (
              <Badge
                className="h-3.5 px-1 py-0 text-[9px] text-muted-foreground"
                variant="outline"
              >
                +{model.capabilities.length - 2}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

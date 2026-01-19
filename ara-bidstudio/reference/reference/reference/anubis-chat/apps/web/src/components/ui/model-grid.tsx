'use client';

import { Filter } from 'lucide-react';
import { useState } from 'react';
import { useSubscriptionStatus } from '@/components/providers/auth-provider';
import { ModelCard } from '@/components/ui/model-card';
import {
  ProviderFilter,
  type ProviderFilter as ProviderFilterType,
} from '@/components/ui/provider-filter';
import {
  AI_MODELS,
  type AIModel,
  isPremiumModel,
} from '@/lib/constants/ai-models';

interface ModelGridProps {
  models?: AIModel[];
  selectedModelId?: string;
  onModelSelect: (model: AIModel) => void;
  columns?: 2 | 3 | 4 | 5;
  showFilter?: boolean;
  compact?: boolean;
  className?: string;
  filterClassName?: string;
  gridClassName?: string;
}

export function ModelGrid({
  models,
  selectedModelId,
  onModelSelect,
  columns = 5,
  showFilter = true,
  compact = false,
  className = '',
  filterClassName = '',
  gridClassName = '',
}: ModelGridProps) {
  const [providerFilter, setProviderFilter] =
    useState<ProviderFilterType>('all');
  const _subscription = useSubscriptionStatus();

  // Filter models based on provider only (show all models but some disabled)
  const sourceModels = models ?? AI_MODELS;
  const filteredModels = sourceModels.filter((model) => {
    // Provider filter
    if (providerFilter !== 'all' && model.provider !== providerFilter) {
      return false;
    }
    // Show all models regardless of subscription
    return true;
  });

  // Sort models by tier: Free -> Standard -> Premium
  const availableModels = filteredModels.sort((a, b) => {
    // Determine tier for each model
    const getTierPriority = (model: AIModel) => {
      const isFree = model.pricing.input === 0 && model.pricing.output === 0;
      const isPremium = isPremiumModel(model);

      if (isFree) {
        return 0; // Free first
      }
      if (!isPremium) {
        return 1; // Standard second
      }
      return 2; // Premium last
    };

    const aPriority = getTierPriority(a);
    const bPriority = getTierPriority(b);

    // Sort by tier priority, then by name
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    return a.name.localeCompare(b.name);
  });

  const getGridCols = () => {
    switch (columns) {
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      default:
        return 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {showFilter && (
        <ProviderFilter
          availableCount={availableModels.length}
          className={filterClassName}
          onSelect={setProviderFilter}
          selected={providerFilter}
        />
      )}

      <div
        className={`grid ${getGridCols()} gap-1.5 sm:gap-2 ${gridClassName}`}
      >
        {availableModels.map((model) => (
          <ModelCard
            compact={compact}
            isSelected={selectedModelId === model.id}
            key={model.id}
            model={model}
            onClick={onModelSelect}
          />
        ))}
      </div>

      {availableModels.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          <Filter className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p>No models found for the selected provider.</p>
        </div>
      )}
    </div>
  );
}

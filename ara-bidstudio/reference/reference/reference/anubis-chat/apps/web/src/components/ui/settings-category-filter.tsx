'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SettingsCategory =
  | 'all'
  | 'model'
  | 'behavior'
  | 'interface'
  | 'advanced';

interface SettingsCategoryFilterProps {
  selected: SettingsCategory;
  onSelect: (category: SettingsCategory) => void;
  settings: Array<{ category: SettingsCategory }>;
  className?: string;
}

const categoryLabels: Record<SettingsCategory, string> = {
  all: 'All Settings',
  model: 'Model',
  behavior: 'Behavior',
  interface: 'Interface',
  advanced: 'Advanced',
};

export function SettingsCategoryFilter({
  selected,
  onSelect,
  settings,
  className,
}: SettingsCategoryFilterProps) {
  // Count settings by category
  const getCategoryCount = (category: SettingsCategory): number => {
    if (category === 'all') {
      return settings.length;
    }
    return settings.filter((setting) => setting.category === category).length;
  };

  const categories: SettingsCategory[] = [
    'all',
    'model',
    'behavior',
    'interface',
    'advanced',
  ];

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {categories.map((category) => {
        const count = getCategoryCount(category);
        const isSelected = selected === category;

        // Don't show categories with no settings (except 'all')
        if (count === 0 && category !== 'all') {
          return null;
        }

        return (
          <Button
            className={cn(
              'transition-all duration-200',
              isSelected && 'shadow-md'
            )}
            key={category}
            onClick={() => onSelect(category)}
            size="sm"
            variant={isSelected ? 'default' : 'outline'}
          >
            {categoryLabels[category]}
            <Badge
              className={cn(
                'ml-2 text-xs',
                isSelected && 'bg-primary-foreground text-primary'
              )}
              variant={isSelected ? 'secondary' : 'outline'}
            >
              {count}
            </Badge>
          </Button>
        );
      })}
    </div>
  );
}

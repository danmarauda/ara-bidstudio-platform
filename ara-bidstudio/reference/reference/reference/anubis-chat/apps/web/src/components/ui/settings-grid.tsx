'use client';

import { Settings } from 'lucide-react';
import { useState } from 'react';
import {
  SettingCard,
  type SettingCardProps,
} from '@/components/ui/setting-card';
import {
  type SettingsCategory,
  SettingsCategoryFilter,
} from '@/components/ui/settings-category-filter';

export interface GridSetting extends SettingCardProps {
  category: SettingsCategory;
}

interface SettingsGridProps {
  settings: GridSetting[];
  columns?: 2 | 3 | 4;
  showFilter?: boolean;
  compact?: boolean;
  className?: string;
  filterClassName?: string;
  gridClassName?: string;
}

export function SettingsGrid({
  settings,
  columns = 3,
  showFilter = true,
  compact = false,
  className = '',
  filterClassName = '',
  gridClassName = '',
}: SettingsGridProps) {
  const [categoryFilter, setCategoryFilter] = useState<SettingsCategory>('all');

  // Filter settings based on category
  const filteredSettings = settings.filter((setting) => {
    if (categoryFilter === 'all') {
      return true;
    }
    return setting.category === categoryFilter;
  });

  const getGridCols = () => {
    switch (columns) {
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {showFilter && (
        <SettingsCategoryFilter
          className={filterClassName}
          onSelect={setCategoryFilter}
          selected={categoryFilter}
          settings={settings}
        />
      )}

      <div className={`grid ${getGridCols()} gap-3 ${gridClassName}`}>
        {filteredSettings.map((setting) => (
          <SettingCard key={setting.id} {...setting} compact={compact} />
        ))}
      </div>

      {filteredSettings.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          <Settings className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p>No settings found for the selected category.</p>
        </div>
      )}
    </div>
  );
}

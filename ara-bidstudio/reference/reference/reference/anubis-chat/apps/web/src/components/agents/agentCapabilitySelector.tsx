'use client';

import { motion } from 'framer-motion';
import { Check, Search } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { capabilities, categories } from './constants';

interface AgentCapabilitySelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  maxSelections?: number;
}

export function AgentCapabilitySelector({
  selected = [],
  onChange,
  maxSelections,
}: AgentCapabilitySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [hoveredCapability, setHoveredCapability] = useState<string | null>(
    null
  );

  const filteredCapabilities = capabilities.filter((cap) => {
    const matchesSearch =
      cap.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cap.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || cap.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleCapability = (capabilityId: string) => {
    if (selected.includes(capabilityId)) {
      onChange(selected.filter((id) => id !== capabilityId));
    } else if (!maxSelections || selected.length < maxSelections) {
      onChange([...selected, capabilityId]);
    }
  };

  const getCategoryCapabilities = (category: string) => {
    return capabilities.filter((cap) => cap.category === category);
  };

  const getCategoryCount = (category: string) => {
    const categoryCapabilities = getCategoryCapabilities(category);
    return categoryCapabilities.filter((cap) => selected.includes(cap.id))
      .length;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search capabilities..."
            value={searchQuery}
          />
        </div>
        <div className="flex gap-1">
          {maxSelections && (
            <Badge className="px-3 py-2" variant="outline">
              {selected.length} / {maxSelections}
            </Badge>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <ScrollArea className="w-full whitespace-nowrap pb-2">
        <div className="flex gap-2">
          {categories.map((category) => {
            const count =
              category === 'All' ? selected.length : getCategoryCount(category);
            return (
              <Button
                className="relative"
                key={category}
                onClick={() => setSelectedCategory(category)}
                size="sm"
                variant={selectedCategory === category ? 'default' : 'outline'}
              >
                {category}
                {count > 0 && (
                  <Badge className="ml-2 h-5 px-1" variant="secondary">
                    {count}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Capabilities Grid */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredCapabilities.map((capability) => {
            const isSelected = selected.includes(capability.id);
            const isDisabled =
              !isSelected && maxSelections && selected.length >= maxSelections;
            const Icon = capability.icon;

            return (
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                initial={{ opacity: 0, scale: 0.95 }}
                key={capability.id}
                onMouseEnter={() => setHoveredCapability(capability.id)}
                onMouseLeave={() => setHoveredCapability(null)}
                transition={{ duration: 0.2 }}
              >
                <Button
                  className={cn(
                    'group relative h-auto justify-start p-4 text-left',
                    'transition-all hover:shadow-md',
                    isDisabled && 'cursor-not-allowed opacity-50'
                  )}
                  disabled={!!isDisabled}
                  onClick={() => !isDisabled && toggleCapability(capability.id)}
                  variant={isSelected ? 'default' : 'outline'}
                >
                  <div className="flex w-full items-start gap-3">
                    <div
                      className={cn(
                        'rounded-lg p-2',
                        isSelected ? 'bg-primary-foreground/10' : 'bg-muted'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{capability.name}</span>
                        {capability.premium && (
                          <Badge className="text-xs" variant="secondary">
                            Premium
                          </Badge>
                        )}
                        {capability.beta && (
                          <Badge className="text-xs" variant="outline">
                            Beta
                          </Badge>
                        )}
                      </div>
                      <p className="line-clamp-2 text-muted-foreground text-sm">
                        {capability.description}
                      </p>
                    </div>

                    {isSelected && (
                      <motion.div
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2"
                        initial={{ scale: 0 }}
                      >
                        <Check className="h-4 w-4 text-primary" />
                      </motion.div>
                    )}
                  </div>

                  {/* Hover Info */}
                  {hoveredCapability === capability.id &&
                    (capability.dependencies || capability.incompatible) && (
                      <motion.div
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute right-0 bottom-full left-0 z-10 mb-2 rounded-md border bg-popover p-2 shadow-lg"
                        initial={{ opacity: 0, y: 5 }}
                      >
                        {capability.dependencies &&
                          capability.dependencies.length > 0 && (
                            <div className="text-xs">
                              <span className="font-medium">Requires: </span>
                              {capability.dependencies.join(', ')}
                            </div>
                          )}
                        {capability.incompatible &&
                          capability.incompatible.length > 0 && (
                            <div className="text-destructive text-xs">
                              <span className="font-medium">
                                Incompatible with:{' '}
                              </span>
                              {capability.incompatible.join(', ')}
                            </div>
                          )}
                      </motion.div>
                    )}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {filteredCapabilities.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No capabilities found</p>
          </div>
        )}
      </ScrollArea>

      {/* Quick Actions */}
      {selected.length > 0 && (
        <div className="flex items-center justify-between border-t pt-2">
          <p className="text-muted-foreground text-sm">
            {selected.length} capabilities selected
          </p>
          <Button onClick={() => onChange([])} size="sm" variant="ghost">
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

export default AgentCapabilitySelector;

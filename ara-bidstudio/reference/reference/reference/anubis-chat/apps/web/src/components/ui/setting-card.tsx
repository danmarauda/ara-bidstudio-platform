'use client';

import { Check, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export type SettingType =
  | 'select'
  | 'slider'
  | 'switch'
  | 'textarea'
  | 'display'
  | 'action';

export interface SettingOption {
  value: string | number;
  label: string;
  badge?: string;
  icon?: React.ReactNode;
}

export interface SettingCardProps {
  id: string;
  title: string;
  description?: string;
  type: SettingType;
  value?: any;
  onChange?: (value: any) => void;
  onClick?: () => void;

  // Select options
  options?: SettingOption[];

  // Slider options
  min?: number;
  max?: number;
  step?: number;

  // Display options
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive';

  // Textarea options
  rows?: number;
  placeholder?: string;

  // Styling
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  isSelected?: boolean;
  compact?: boolean;
}

export function SettingCard({
  id,
  title,
  description,
  type,
  value,
  onChange,
  onClick,
  options = [],
  min = 0,
  max = 100,
  step = 1,
  badge,
  badgeVariant = 'secondary',
  rows = 3,
  placeholder,
  icon,
  className,
  disabled = false,
  isSelected = false,
  compact = false,
}: SettingCardProps) {
  const renderControl = () => {
    switch (type) {
      case 'select':
        return (
          <Select
            disabled={disabled}
            onValueChange={onChange}
            value={value?.toString()}
          >
            <SelectTrigger className={cn('w-full', compact && 'h-8')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value.toString()}
                  value={option.value.toString()}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <span>{option.label}</span>
                    </div>
                    {option.badge && (
                      <Badge className="ml-2 text-xs" variant="outline">
                        {option.badge}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'slider':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{title}</span>
              <span className="text-muted-foreground text-sm">{value}</span>
            </div>
            <Slider
              className="w-full"
              disabled={disabled}
              max={max}
              min={min}
              onValueChange={([newValue]) => onChange?.(newValue)}
              step={step}
              value={[value]}
            />
            {description && (
              <p className="text-muted-foreground text-xs">{description}</p>
            )}
          </div>
        );

      case 'switch':
        return (
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Label className="font-medium text-sm leading-tight" htmlFor={id}>
                {title}
              </Label>
              {description && (
                <p className="text-muted-foreground text-xs leading-snug">
                  {description}
                </p>
              )}
            </div>
            <Switch
              checked={value}
              disabled={disabled}
              id={id}
              onCheckedChange={onChange}
            />
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-2">
            <Label className="font-medium text-sm leading-tight" htmlFor={id}>
              {title}
            </Label>
            <Textarea
              className={cn('leading-snug', compact && 'text-sm')}
              disabled={disabled}
              id={id}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={placeholder}
              rows={rows}
              value={value}
            />
            {description && (
              <p className="text-muted-foreground text-xs leading-snug">
                {description}
              </p>
            )}
          </div>
        );

      case 'display':
        return (
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Label className="font-medium text-sm leading-tight">
                {title}
              </Label>
              {description && (
                <p className="text-muted-foreground text-xs leading-snug">
                  {description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {badge && (
                <Badge
                  className="h-5 px-1.5 text-[10px]"
                  variant={badgeVariant}
                >
                  {badge}
                </Badge>
              )}
              <span className="text-sm leading-tight">{value}</span>
            </div>
          </div>
        );

      case 'action':
        return (
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 space-y-0.5">
              <Label className="font-medium text-sm leading-tight">
                {title}
              </Label>
              {description && (
                <p className="text-muted-foreground text-xs leading-snug">
                  {description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {badge && (
                <Badge
                  className="h-5 px-1.5 text-[10px]"
                  variant={badgeVariant}
                >
                  {badge}
                </Badge>
              )}
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (type === 'switch' || type === 'display' || type === 'action') {
    return (
      <Card
        className={cn(
          'transition-all duration-200 hover:ring-1 hover:ring-primary/20',
          type === 'action' && 'cursor-pointer hover:shadow-md',
          isSelected && 'border-primary ring-2 ring-primary',
          disabled && 'opacity-50',
          compact ? 'min-h-[60px]' : 'min-h-[80px]',
          className
        )}
        onClick={type === 'action' ? onClick : undefined}
      >
        <CardContent className={cn('p-4', compact && 'p-3')}>
          <div className="flex items-center gap-2">
            {icon}
            {renderControl()}
            {isSelected && type === 'action' && (
              <Check className="h-4 w-4 flex-shrink-0 text-primary" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:ring-1 hover:ring-primary/20',
        isSelected && 'border-primary ring-2 ring-primary',
        disabled && 'opacity-50',
        compact ? 'min-h-[100px]' : 'min-h-[120px]',
        className
      )}
    >
      <CardHeader className={cn('pb-2', compact && 'p-3 pb-2')}>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle
            className={cn(
              'text-[13px] leading-tight sm:text-sm',
              compact && 'text-xs'
            )}
          >
            {type !== 'slider' && title}
          </CardTitle>
          {isSelected && (
            <Check className="h-4 w-4 flex-shrink-0 text-primary" />
          )}
        </div>
        {description && type !== 'slider' && (
          <CardDescription
            className={cn('text-xs leading-snug', compact && 'text-xs')}
          >
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={cn('pt-0', compact && 'p-3 pt-0')}>
        {renderControl()}
      </CardContent>
    </Card>
  );
}

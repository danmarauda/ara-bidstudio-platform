import { AlertCircle } from 'lucide-react';
import type { FieldErrorProps } from '@/lib/types/components';
import { cn } from '@/lib/utils';

/**
 * FieldError component - Display form field validation errors
 */
export function FieldError({
  message,
  show = true,
  className,
  children,
}: FieldErrorProps) {
  if (!(show && message)) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center space-x-1 text-red-600 text-sm dark:text-red-400',
        className
      )}
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
      {children}
    </div>
  );
}

export default FieldError;

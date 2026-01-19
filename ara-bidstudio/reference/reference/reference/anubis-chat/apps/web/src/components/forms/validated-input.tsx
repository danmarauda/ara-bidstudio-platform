'use client';

import { useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ValidatedInputProps } from '@/lib/types/components';
import { cn } from '@/lib/utils';
import { FieldError } from './field-error';

/**
 * ValidatedInput component - Input with form validation
 * Uses standard React state for form management
 */
export function ValidatedInput({
  name,
  label,
  type = 'text',
  required = false,
  disabled = false,
  placeholder,
  autoComplete,
  className,
  children,
}: ValidatedInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);

  const validateValue = useCallback(
    (val: string) => {
      if (required && (!val || val.trim() === '')) {
        return `${label ?? name} is required`;
      }

      if (type === 'email' && val) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          return 'Please enter a valid email address';
        }
      }

      if (type === 'url' && val) {
        try {
          new URL(val);
        } catch {
          return 'Please enter a valid URL';
        }
      }

      return;
    },
    [required, type, label, name]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (touched) {
      setError(validateValue(newValue));
    }

    // Try to update parent form data
    try {
      const formContext = JSON.parse(
        e.target
          .closest('form')
          ?.querySelector('[data-form-context]')
          ?.getAttribute('data-form-context') || '{}'
      );
      if (formContext.updateField) {
        formContext.updateField(name, newValue);
      }
    } catch {
      // Ignore if not in a FormWrapper context
    }
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateValue(value));
  };

  const hasError = Boolean(error && touched);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label
          className={
            required
              ? 'after:ml-0.5 after:text-red-500 after:content-["*"]'
              : ''
          }
          htmlFor={name}
        >
          {label}
        </Label>
      )}

      <Input
        aria-describedby={hasError ? `${name}-error` : undefined}
        aria-invalid={hasError}
        autoComplete={autoComplete}
        className={cn(
          hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500'
        )}
        disabled={disabled}
        id={name}
        name={name}
        onBlur={handleBlur}
        onChange={handleChange}
        placeholder={placeholder}
        type={type}
        value={value}
      />

      <FieldError message={error} show={hasError} />

      {children}
    </div>
  );
}

export default ValidatedInput;

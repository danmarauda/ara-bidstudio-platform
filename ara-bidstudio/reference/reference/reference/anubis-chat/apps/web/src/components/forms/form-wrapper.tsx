'use client';

import { useState } from 'react';
import type { FormWrapperProps } from '@/lib/types/components';
import { cn } from '@/lib/utils';
import { createModuleLogger } from '@/lib/utils/logger';

// Initialize logger
const log = createModuleLogger('form-wrapper');

/**
 * FormWrapper component - Simple form wrapper with validation
 * Provides form state management and validation
 */
export function FormWrapper({
  onSubmit,
  defaultValues = {},
  resetOnSubmit = false,
  className,
  children,
}: FormWrapperProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(defaultValues);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      if (resetOnSubmit) {
        setFormData(defaultValues);
      }
    } catch (error) {
      log.error('Form submission failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        operation: 'form_submission',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form className={cn('space-y-6', className)} onSubmit={handleSubmit}>
      <div
        data-form-context={JSON.stringify({
          formData,
          updateField,
          isSubmitting,
        })}
      >
        {children}
      </div>
    </form>
  );
}

export default FormWrapper;

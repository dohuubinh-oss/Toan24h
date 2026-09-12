import React from 'react';
import { Label } from './Label';
import { cn } from '../../lib/utils';

export interface FormFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
  children: React.ReactElement;
  htmlFor?: string;
}

export function FormField({
  label,
  error,
  helperText,
  required,
  className,
  children,
  htmlFor,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col mb-4", className)}>
      {label && (
        <Label htmlFor={htmlFor} required={required} className={error ? "text-red-500 dark:text-red-400" : ""}>
          {label}
        </Label>
      )}
      
      {children}
      
      {error && (
        <p className="mt-1.5 text-sm text-red-500 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
      
      {!error && helperText && (
        <p className="mt-1.5 text-sm text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
}

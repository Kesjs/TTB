import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label,
    error,
    helperText,
    className,
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-zinc-300 mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-2.5 bg-zinc-800 border-2 rounded-lg',
            'text-white placeholder-zinc-500',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-[#e5c47f] focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-zinc-700 focus:border-[#e5c47f]',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p 
            id={`${inputId}-error`}
            className="mt-1 text-sm text-red-500"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p 
            id={`${inputId}-helper`}
            className="mt-1 text-sm text-zinc-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

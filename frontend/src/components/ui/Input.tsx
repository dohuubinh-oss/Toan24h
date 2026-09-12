import React from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  error?: boolean;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, leftSection, rightSection, ...props }, ref) => {
    const inputContent = (
      <input
        ref={ref}
        className={cn(
          "w-full px-4 h-12 rounded-lg border bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
          error ? "border-red-500 focus:ring-red-500" : "border-slate-200",
          leftSection && "pl-11",
          rightSection && "pr-11",
          className
        )}
        {...props}
      />
    );

    if (!leftSection && !rightSection) {
      return inputContent;
    }

    return (
      <div className="relative w-full">
        {leftSection && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            {leftSection}
          </div>
        )}
        {inputContent}
        {rightSection && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
            {rightSection}
          </div>
        )}
      </div>
    );
  }
)
Input.displayName = 'Input'

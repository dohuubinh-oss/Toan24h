import React from 'react'
import { cn } from '../../lib/utils'
import { Icon } from './Icon'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode
  error?: boolean
  containerClassName?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, containerClassName, label, error, ...props }, ref) => {
    return (
      <label className={cn("inline-flex items-center gap-2 cursor-pointer group", containerClassName)}>
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            className="peer sr-only"
            ref={ref}
            {...props}
          />
          <div
            className={cn(
              "w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center",
              "border-slate-300 bg-white text-transparent",
              "group-hover:border-primary/50",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 peer-focus-visible:ring-offset-1",
              "peer-checked:bg-primary peer-checked:border-primary peer-checked:text-white",
              "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:bg-slate-100",
              error && "border-red-500 peer-checked:bg-red-500 peer-checked:border-red-500",
              className
            )}
          >
            <Icon name="Check" size={14} className="opacity-0 peer-checked:opacity-100 transition-opacity duration-200" />
          </div>
        </div>
        {label && (
          <span className={cn(
            "text-sm font-medium text-slate-700 select-none",
            "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
            error && "text-red-500"
          )}>
            {label}
          </span>
        )}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'

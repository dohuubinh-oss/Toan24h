import React from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full px-4 h-12 rounded-lg border bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
          error ? "border-red-500 focus:ring-red-500" : "border-slate-200",
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

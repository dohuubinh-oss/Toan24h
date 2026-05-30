import React from 'react'
import { cn } from '../../lib/utils'

export type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'outline'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: 'sm' | 'md' | 'lg'
}

export function Badge({ 
  className, 
  variant = 'default', 
  size = 'md',
  ...props 
}: BadgeProps) {
  const baseStyles = "inline-flex items-center justify-center font-bold rounded-full transition-colors"
  
  const variants = {
    default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    success: "bg-success/10 text-success border border-success/20",
    error: "bg-error/10 text-error border border-error/20",
    warning: "bg-warning/10 text-warning border border-warning/20",
    info: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50",
    outline: "border-2 border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300",
  }

  const sizes = {
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  }

  return (
    <span 
      className={cn(baseStyles, variants[variant], sizes[size], className)} 
      {...props} 
    />
  )
}

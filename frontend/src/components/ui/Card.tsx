import React from 'react'
import { cn } from '../../lib/utils'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn("bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-shadow hover:shadow-md", className)} 
      {...props} 
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn("p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800", className)} 
      {...props} 
    />
  )
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn("p-6 sm:p-8", className)} 
      {...props} 
    />
  )
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn("p-6 sm:p-8 bg-slate-50 dark:bg-slate-950/50 rounded-b-2xl border-t border-slate-100 dark:border-slate-800", className)} 
      {...props} 
    />
  )
}

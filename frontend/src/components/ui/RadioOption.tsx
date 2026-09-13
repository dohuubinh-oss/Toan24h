import React from 'react'
import { cn } from '../../lib/utils'
import { Icon } from './Icon'

export interface RadioOptionProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode
  prefixContent?: React.ReactNode
  containerClassName?: string
}

export const RadioOption = React.forwardRef<HTMLInputElement, RadioOptionProps>(
  ({ className, containerClassName, label, prefixContent, ...props }, ref) => {
    return (
      <label
        className={cn(
          "group relative flex items-center p-5 bg-white  border-2 border-slate-200  rounded-xl cursor-pointer transition-all duration-200",
          "hover:border-blue-400  hover:bg-blue-50/50 ",
          "has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50  has-[:checked]:ring-4 has-[:checked]:ring-blue-500/20",
          "has-[:disabled]:opacity-50 has-[:disabled]:cursor-not-allowed",
          containerClassName
        )}
      >
        <input
          type="radio"
          ref={ref}
          className="sr-only"
          {...props}
        />
        
        {prefixContent && (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-500 font-bold mr-4 group-has-[:checked]:bg-blue-500 group-has-[:checked]:text-white transition-colors shrink-0">
            {prefixContent}
          </div>
        )}
        
        <div className="text-slate-700 font-medium text-lg flex-1">
          {label}
        </div>
        
        <div className="absolute right-5 opacity-0 group-has-[:checked]:opacity-100 transition-opacity shrink-0">
          <Icon name="CheckCircle2" className="text-blue-500" />
        </div>
      </label>
    )
  }
)
RadioOption.displayName = 'RadioOption'

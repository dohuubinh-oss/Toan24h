import React from 'react'
import * as icons from 'lucide-react'
import { cn } from '../../lib/utils'

export type IconName = keyof typeof icons

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName
  size?: number | string
  className?: string
}

export function Icon({ name, size = 24, className, ...props }: IconProps) {
  // Ep kieu as React.ElementType de tranh loi JSX element type
  const LucideIcon = icons[name] as React.ElementType

  if (!LucideIcon) {
    return null
  }

  return <LucideIcon size={size} className={cn('', className)} {...props} />
}

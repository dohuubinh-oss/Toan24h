import React from 'react'
import {
  Plus,
  Home,
  User,
  Settings,
  FunctionSquare,
  CheckCircle2,
  XCircle,
  Check,
  LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const ICON_MAP: Record<string, LucideIcon> = {
  Plus,
  Home,
  User,
  Settings,
  FunctionSquare,
  CheckCircle2,
  XCircle,
  Check,
}

export type IconName = keyof typeof ICON_MAP | string

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName
  size?: number | string
  className?: string
}

export function Icon({ name, size = 24, className, ...props }: IconProps) {
  const LucideIcon = ICON_MAP[name] as React.ElementType

  if (!LucideIcon) {
    return null
  }

  return <LucideIcon size={size} className={cn('', className)} {...props} />
}

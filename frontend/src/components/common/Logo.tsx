import React from 'react'
import Image from 'next/image'
import logoIconImg from '../../../public/logo-icon.png'

export type LogoLayout = 'horizontal' | 'stacked' | 'icon-only'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  layout?: LogoLayout
  priority?: boolean
}

/**
 * Biểu tượng Icon Độc Lập (PNG):
 * Icon toan6789 (Bộ số 6-7-8-9, Khiên phép tính toán học + - x ÷, Sách mở và Dấu tích chuẩn)
 * Tỉ lệ chuẩn ~1.30:1, được cắt sát biên thực tế 100% không chứa khoảng trắng ẩn
 */
export function LogoIcon({
  className = '',
  size = 'md',
  priority = false,
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  priority?: boolean
}) {
  const sizeMap = {
    sm: { h: 'h-8', w: 42, height: 32 },
    md: { h: 'h-10 sm:h-11', w: 57, height: 44 },
    lg: { h: 'h-14 sm:h-16', w: 83, height: 64 },
    xl: { h: 'h-20 sm:h-24', w: 125, height: 96 },
  }

  const { h, w, height } = sizeMap[size]

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${h} w-auto ${className}`}>
      <Image
        src={logoIconImg}
        alt="toan6789.vn Icon"
        width={w}
        height={height}
        priority={priority}
        className="h-full w-auto object-contain drop-shadow-xs"
      />
    </div>
  )
}

/**
 * Component Logo PNG Chính Thức:
 * - layout="horizontal": Icon PNG bên trái + Chữ MathAI bên phải (Header, Navigation, Footer)
 * - layout="stacked": Icon PNG ở trên + Chữ MathAI bên dưới (Auth, Hero, Splash)
 * - layout="icon-only": Chỉ Icon PNG độc lập (Favicon, Mobile App, Collapsed Sidebar)
 *
 * Khoảng cách giữa Icon và Chữ được tinh chỉnh gọn gàng, liền mạch theo đúng bản thiết kế gốc.
 */
export default function Logo({
  className = '',
  showText = true,
  size = 'md',
  layout = 'horizontal',
  priority = false,
}: LogoProps) {
  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  }

  const gapClasses = {
    sm: 'gap-1.5',
    md: 'gap-2',
    lg: 'gap-2.5',
    xl: 'gap-3',
  }

  // Dạng 1: Chỉ Icon PNG độc lập
  if (layout === 'icon-only' || !showText) {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        <LogoIcon size={size} priority={priority} />
      </div>
    )
  }

  // Dạng 2: Icon PNG ở trên + Chữ MathAI ở dưới (Stacked)
  if (layout === 'stacked') {
    return (
      <div className={`inline-flex flex-col items-center justify-center gap-1.5 select-none ${className}`}>
        <LogoIcon size={size} priority={priority} />
        <span className={`${textSizes[size]} font-bold tracking-tight text-slate-900 flex items-center`}>
          <span>Math</span>
          <span className="text-primary font-bold">AI</span>
        </span>
      </div>
    )
  }

  // Dạng 3: Icon PNG bên trái + Chữ MathAI bên phải (Horizontal - Mặc định)
  return (
    <div className={`inline-flex items-center ${gapClasses[size]} select-none ${className}`}>
      <LogoIcon size={size} priority={priority} />
      <span className={`${textSizes[size]} font-bold tracking-tight text-slate-900 flex items-center leading-none`}>
        <span>Math</span>
        <span className="text-primary font-bold">AI</span>
      </span>
    </div>
  )
}

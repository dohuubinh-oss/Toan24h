'use client'

import React, { useEffect, useState, useMemo } from 'react'

export interface DynamicWatermarkProps {
  /** Optional custom text override (e.g. student email or phone). If omitted, auto-extracts from logged-in user profile */
  text?: string
  /** Watermark text opacity between 0.01 and 0.2 (default 0.055) */
  opacity?: number
  /** Angle of diagonal watermark in degrees (default -22) */
  angle?: number
  /** Container z-index (default 40) */
  zIndex?: number
  /** Position mode: 'fixed' (viewport wide) or 'absolute' (relative to parent) */
  position?: 'fixed' | 'absolute'
}

export default function DynamicWatermark({
  text: customText,
  opacity = 0.055,
  angle = -22,
  zIndex = 40,
  position = 'fixed',
}: DynamicWatermarkProps) {
  const [displayText, setDisplayText] = useState<string>('')
  const [patternUrl, setPatternUrl] = useState<string>('')

  // 1. Resolve student identifier (Email or Phone or FullName)
  useEffect(() => {
    if (customText) {
      setDisplayText(customText)
      return
    }

    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      if (userStr) {
        const user = JSON.parse(userStr)
        const identifier = user.email || user.phone || user.fullName || ''
        if (identifier) {
          setDisplayText(identifier)
          return
        }
      }
    } catch (_) {}

    // Fallback if not logged in
    setDisplayText('')
  }, [customText])

  // 2. Generate repeating canvas pattern
  useEffect(() => {
    if (!displayText) {
      setPatternUrl('')
      return
    }

    if (typeof document === 'undefined') return

    const canvas = document.createElement('canvas')
    const width = 340
    const height = 190
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    // Translate to center and rotate
    ctx.save()
    ctx.translate(width / 2, height / 2)
    ctx.rotate((angle * Math.PI) / 180)

    // Primary identity text (Email / Phone)
    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillStyle = `rgba(15, 23, 42, ${opacity})`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(displayText, 0, -8)

    // Secondary platform text
    ctx.font = '500 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillStyle = `rgba(15, 23, 42, ${opacity * 0.8})`
    ctx.fillText('toan6789.vn • Chống sao chép lậu', 0, 10)

    ctx.restore()

    try {
      const dataUrl = canvas.toDataURL('image/png')
      setPatternUrl(dataUrl)
    } catch (_) {}
  }, [displayText, opacity, angle])

  if (!displayText || !patternUrl) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      data-testid="dynamic-watermark"
      className={`${position} inset-0 pointer-events-none select-none overflow-hidden`}
      style={{
        zIndex,
        backgroundImage: `url(${patternUrl})`,
        backgroundRepeat: 'repeat',
      }}
    >
      {/* Subtle floating anti-crop identity tag in bottom-right corner */}
      <div
        className="absolute bottom-3 right-4 pointer-events-none select-none text-[11px] font-mono text-slate-900/15 tracking-wider hidden sm:block"
        style={{ userSelect: 'none' }}
      >
        ID: {displayText}
      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2 } from 'lucide-react'

export interface ImageViewerModalProps {
  isOpen: boolean
  src: string
  alt?: string
  onClose: () => void
}

export default function ImageViewerModal({
  isOpen,
  src,
  alt = 'Hình ảnh chi tiết',
  onClose,
}: ImageViewerModalProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const lastTouchDistanceRef = useRef<number | null>(null)
  const lastTapRef = useRef<number>(0)
  const initialPinchScaleRef = useRef<number>(1)

  // Reset zoom & pan when image changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
      setIsDragging(false)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, src])

  // Keyboard shortcut support (Escape to close, +/- to zoom)
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn()
      } else if (e.key === '-') {
        handleZoomOut()
      } else if (e.key === '0') {
        handleResetZoom()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(Number((prev + 0.5).toFixed(1)), 5))
  }, [])

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(Number((prev - 0.5).toFixed(1)), 1)
      if (next === 1) setPosition({ x: 0, y: 0 })
      return next
    })
  }, [])

  const handleResetZoom = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  // Toggle fullscreen mode in browser
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.().catch(() => {})
      setIsFullscreen(false)
    }
  }, [])

  // Double tap / double click to toggle zoom
  const handleDoubleTap = useCallback(
    (clientX: number, clientY: number) => {
      if (scale > 1) {
        handleResetZoom()
      } else {
        setScale(2.5)
        // Zoom toward tap position
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          const offsetX = (clientX - (rect.left + rect.width / 2)) * -1
          const offsetY = (clientY - (rect.top + rect.height / 2)) * -1
          setPosition({ x: offsetX * 0.8, y: offsetY * 0.8 })
        }
      }
    },
    [scale, handleResetZoom]
  )

  // Touch handlers for Pinch-to-Zoom & Pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 2 fingers = pinch
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      lastTouchDistanceRef.current = dist
      initialPinchScaleRef.current = scale
      setIsDragging(false)
    } else if (e.touches.length === 1) {
      // 1 finger = pan or double-tap
      const now = Date.now()
      const touch = e.touches[0]
      if (now - lastTapRef.current < 300) {
        handleDoubleTap(touch.clientX, touch.clientY)
        lastTapRef.current = 0
        return
      }
      lastTapRef.current = now

      if (scale > 1) {
        setIsDragging(true)
        setDragStart({
          x: touch.clientX - position.x,
          y: touch.clientY - position.y,
        })
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistanceRef.current !== null) {
      // Pinching
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const ratio = dist / lastTouchDistanceRef.current
      const newScale = Math.min(Math.max(initialPinchScaleRef.current * ratio, 1), 5)
      setScale(Number(newScale.toFixed(2)))
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 })
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      // Panning
      const touch = e.touches[0]
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      })
    }
  }

  const handleTouchEnd = () => {
    lastTouchDistanceRef.current = null
    setIsDragging(false)
  }

  // Mouse drag handlers for desktop/testing
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col justify-between select-none touch-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh toàn màn hình"
    >
      {/* Top Header Bar */}
      <div className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-b from-black/80 to-transparent text-white">
        <div className="flex items-center gap-2 min-w-0 pr-4">
          <p className="text-sm sm:text-base font-semibold truncate text-slate-200">
            {alt}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all cursor-pointer"
            aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button
            type="button"
            data-testid="lightbox-close"
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 hover:text-red-400 active:scale-95 text-white transition-all cursor-pointer"
            aria-label="Đóng xem ảnh"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div
        className="flex-1 w-full h-full overflow-hidden flex items-center justify-center relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={(e) => handleDoubleTap(e.clientX, e.clientY)}
        style={{
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
        }}
      >
        <img
          ref={imgRef}
          data-testid="lightbox-image"
          src={src}
          alt={alt}
          draggable={false}
          className="max-w-[95%] max-h-[85vh] object-contain select-none pointer-events-auto rounded-lg shadow-2xl transition-transform"
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            touchAction: 'none',
          }}
        />
      </div>

      {/* Bottom Floating Zoom Controls */}
      <div className="relative z-20 pb-6 pt-2 px-4 flex flex-col items-center gap-2 bg-gradient-to-t from-black/80 to-transparent">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-white/15 text-white shadow-2xl backdrop-blur-md">
          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="p-2 rounded-full hover:bg-white/15 disabled:opacity-35 disabled:hover:bg-transparent text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
            aria-label="Thu nhỏ"
          >
            <ZoomOut size={18} />
          </button>

          {/* Scale Display */}
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2.5 py-1 rounded-md text-xs sm:text-sm font-bold text-slate-100 hover:bg-white/10 transition-colors"
            aria-label="Đặt lại thu phóng"
          >
            {Math.round(scale * 100)}%
          </button>

          {/* Zoom In Button */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 5}
            className="p-2 rounded-full hover:bg-white/15 disabled:opacity-35 disabled:hover:bg-transparent text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
            aria-label="Phóng to"
          >
            <ZoomIn size={18} />
          </button>

          {/* Reset Button */}
          <div className="w-px h-4 bg-white/20 mx-0.5" />
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-2 rounded-full hover:bg-white/15 text-white transition-colors cursor-pointer"
            aria-label="Đặt lại về ban đầu"
            title="Đặt lại kích thước ban đầu"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Mobile touch hint */}
        <p className="text-[11px] text-slate-400 font-medium tracking-wide">
          Chạm 2 lần hoặc chụm 2 ngón tay để thu phóng
        </p>
      </div>
    </div>
  )
}

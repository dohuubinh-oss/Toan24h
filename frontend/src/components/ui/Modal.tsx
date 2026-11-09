'use client'

import React, { useEffect, useRef, ReactNode } from 'react'
import { X } from 'lucide-react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  className?: string
  contentClassName?: string
  ariaLabel?: string
  ariaLabelledBy?: string
}

const MAX_WIDTH_CLASSES: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  maxWidth = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  contentClassName = 'p-6 sm:p-7',
  ariaLabel,
  ariaLabelledBy,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // 1. ESC key listener
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeOnEscape, onClose])

  // 2. Body scroll lock
  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  if (!isOpen) return null

  const titleId = ariaLabelledBy || (title ? 'modal-dialog-title' : undefined)
  const widthClass = MAX_WIDTH_CLASSES[maxWidth] || 'max-w-md'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={titleId}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans"
    >
      {/* Backdrop overlay for dismissing */}
      <div
        className="fixed inset-0"
        onClick={() => closeOnBackdropClick && onClose()}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        ref={dialogRef}
        className={`relative bg-white rounded-3xl border border-slate-200/90 shadow-2xl animate-in zoom-in-95 duration-200 w-full ${widthClass} overflow-hidden flex flex-col max-h-[92vh] ${className}`}
      >
        {/* Top Header if title or icon provided */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-100 shrink-0">
            <div className="flex items-start gap-3.5 pr-4 min-w-0">
              {icon && (
                <div className="shrink-0">
                  {icon}
                </div>
              )}
              {title && (
                <div className="min-w-0">
                  <h3 id={titleId} className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                    {title}
                  </h3>
                  {description && (
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng cửa sổ"
                className="min-w-[40px] min-h-[40px] p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className={`overflow-y-auto flex-1 ${contentClassName}`}>
          {children}
        </div>

        {/* Footer if provided */}
        {footer && (
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal

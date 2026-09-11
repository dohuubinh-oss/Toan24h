'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Keyboard, CheckCircle2 } from 'lucide-react'
import MathInput from './MathInput'
import MathText from './MathText'
import { createPortal } from 'react-dom'

interface MathKeyboardModalProps {
  initialValue: string
  anchorEl?: HTMLElement | null
  onChange?: (latex: string) => void
  onSave: (latex: string) => void
  onCancel: () => void
}

export default function MathKeyboardModal({ initialValue, anchorEl, onChange, onSave, onCancel }: MathKeyboardModalProps) {
  const [latex, setLatex] = useState(initialValue || '')
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 300, left: 100 })
  
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (anchorEl && typeof window !== 'undefined') {
      const rect = anchorEl.getBoundingClientRect()
      const modalWidth = 400
      const modalHeight = 240
      
      let top = rect.bottom + window.scrollY + 8
      let left = rect.left + window.scrollX

      // Check if overflowing viewport bottom
      if (rect.bottom + modalHeight > window.innerHeight && rect.top > modalHeight) {
        top = rect.top + window.scrollY - modalHeight - 8
      }

      // Check viewport horizontal boundaries
      const maxLeft = window.innerWidth - modalWidth - 16
      left = Math.max(16, Math.min(maxLeft, left))

      setPosition({ top, left })
    }
  }, [anchorEl])
  
  // Xử lý phím Enter và Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      } else if (e.key === 'Enter') {
        if (e.target && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          onSave(latex)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [latex, onCancel, onSave])

  const handleChange = (val: string) => {
    setLatex(val)
    if (onChange) {
      onChange(val)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div 
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      className="absolute z-[10000] flex flex-col w-[400px] pointer-events-none transition-all duration-150"
    >
      {/* Modal Container */}
      <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl w-full rounded-[20px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col h-fit pointer-events-auto border border-white/50 dark:border-slate-700/50">
        
        {/* Body */}
        <div className="p-4 flex flex-col min-h-0">
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest text-center">Nhập công thức</label>
          <div className="relative rounded-xl overflow-y-auto max-h-[200px] border border-slate-200 dark:border-slate-700/50 shadow-inner bg-slate-50/80 dark:bg-slate-800/50">
            <MathInput 
              value={latex}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md flex items-center justify-between border-t border-slate-100 dark:border-slate-700/50 shrink-0">
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-sm flex-1 mr-2"
          >
            Hủy
          </button>
          <button 
            onClick={() => onSave(latex)}
            className="px-4 py-2 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-all shadow-sm shadow-primary/25 flex items-center justify-center gap-2 text-sm flex-1 ml-2"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Lưu
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Keyboard, CheckCircle2 } from 'lucide-react'
import MathInput from './MathInput'
import MathText from './MathText'
import { createPortal } from 'react-dom'

interface MathKeyboardModalProps {
  initialValue: string
  onSave: (latex: string) => void
  onCancel: () => void
}

export default function MathKeyboardModal({ initialValue, onSave, onCancel }: MathKeyboardModalProps) {
  const [latex, setLatex] = useState(initialValue || '')
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Xử lý phím Enter và Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      } else if (e.key === 'Enter') {
        // Đôi khi người dùng nhấn Enter để xuống dòng trong một số context, 
        // nhưng với MathLive inline thì Enter thường dùng để lưu.
        // Để an toàn, chúng ta chỉ lắng nghe phím Enter trên window nếu focus không ở trong vùng đặc biệt nào khác.
        if (e.target && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          onSave(latex)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [latex, onCancel, onSave])

  if (!mounted) return null

  return createPortal(
    <div className="fixed top-[546px] right-8 z-[100] flex flex-col w-[400px] pointer-events-none">
      {/* Modal Container */}
      <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl w-full rounded-[20px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col h-fit pointer-events-auto border border-white/50 dark:border-slate-700/50">
        
        {/* Body */}
        <div className="p-4 flex flex-col min-h-0">
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest text-center">Nhập công thức</label>
          <div className="relative rounded-xl overflow-y-auto max-h-[200px] border border-slate-200 dark:border-slate-700/50 shadow-inner bg-slate-50/80 dark:bg-slate-800/50">
            <MathInput 
              value={latex}
              onChange={setLatex}
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

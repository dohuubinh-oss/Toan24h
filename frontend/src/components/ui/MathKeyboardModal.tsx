'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Keyboard, CheckCircle2 } from 'lucide-react'
import MathInput, { MathInputHandle } from './MathInput'
import MathText from './MathText'
import { createPortal } from 'react-dom'

interface MathKeyboardModalProps {
  initialValue: string
  anchorEl?: HTMLElement | null
  onChange?: (latex: string) => void
  onSave: (latex: string) => void
  onCancel: () => void
}

const QUICK_SYMBOLS = [
  { label: 'a/b', latex: '\\frac{#0}{#?}', title: 'Phân số (a/b)' },
  { label: ':', latex: ' : ', title: 'Phép chia hai chấm (:)' },
  { label: '·', latex: ' \\cdot ', title: 'Phép nhân dấu chấm (·)' },
  { label: '+', latex: '+', title: 'Phép cộng (+)' },
  { label: '−', latex: '-', title: 'Phép trừ (−)' },
  { label: '=', latex: '=', title: 'Dấu bằng (=)' },
  { label: ',', latex: ',', title: 'Dấu phẩy thập phân (chuẩn VN)' },
  { label: '√x', latex: '\\sqrt{#0}', title: 'Căn bậc hai' },
  { label: 'x²', latex: '#@^2', title: 'Bình phương' },
  { label: 'xⁿ', latex: '#@^{#0}', title: 'Số mũ' },
  { label: '( )', latex: '\\left(#0\\right)', title: 'Đóng mở ngoặc' },
  { label: '…', latex: '\\dots ', title: 'Dấu ba chấm (\\dots)' },
]

export default function MathKeyboardModal({ initialValue, anchorEl, onChange, onSave, onCancel }: MathKeyboardModalProps) {
  const [latex, setLatex] = useState(initialValue || '')
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 300, left: 100 })
  const mathInputRef = useRef<MathInputHandle>(null)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (anchorEl && typeof window !== 'undefined') {
      const rect = anchorEl.getBoundingClientRect()
      const modalWidth = 440
      const modalHeight = 280
      
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

  const handleQuickInsert = (snippet: string) => {
    if (mathInputRef.current) {
      mathInputRef.current.insertSnippet(snippet)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div 
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      className="absolute z-[10000] flex flex-col w-[440px] pointer-events-none transition-all duration-150"
    >
      {/* Modal Container */}
      <div className="relative bg-white/95 backdrop-blur-2xl w-full rounded-[20px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col h-fit pointer-events-auto border border-white/50">
        
        {/* Body */}
        <div className="p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Soạn công thức</label>
            <span className="text-[10px] text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">Chuẩn VN (phẩy , chia : nhân ·)</span>
          </div>

          {/* Quick Math Symbols Toolbar */}
          <div className="flex items-center flex-wrap gap-1.5 p-2 mb-2 bg-slate-100/80 rounded-xl border border-slate-200/80">
            {QUICK_SYMBOLS.map((sym, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickInsert(sym.latex)}
                title={sym.title}
                className="min-w-[32px] h-7 px-1.5 flex items-center justify-center font-bold text-xs bg-white text-slate-800 rounded-lg border border-slate-200 shadow-xs hover:bg-primary hover:text-white hover:border-primary active:scale-95 transition-all cursor-pointer font-mono"
              >
                {sym.label}
              </button>
            ))}
          </div>

          <div className="relative rounded-xl overflow-y-auto max-h-[200px] border border-slate-200 shadow-inner bg-slate-50/80">
            <MathInput 
              ref={mathInputRef}
              value={latex}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50/80 backdrop-blur-md flex items-center justify-between border-t border-slate-100 shrink-0">
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-xl font-bold text-slate-600 bg-white/50 hover:bg-slate-100 transition-all text-sm flex-1 mr-2"
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

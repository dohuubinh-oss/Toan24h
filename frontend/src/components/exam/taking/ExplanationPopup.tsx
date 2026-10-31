import React, { useState, useEffect } from 'react'
import { X, CheckCircle2 } from 'lucide-react'
import RichTextEditor from '@/components/questions/creator/editor/RichTextEditor'

interface ExplanationPopupProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (explanation: string) => void
  initialExplanation?: string
}

export default function ExplanationPopup({ isOpen, onClose, onSubmit, initialExplanation }: ExplanationPopupProps) {
  const [explanation, setExplanation] = useState('')
  const containerRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setExplanation(initialExplanation || '')
    }
  }, [isOpen, initialExplanation])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      // Don't close if clicking inside popup container
      if (containerRef.current && containerRef.current.contains(target)) {
        return
      }

      // Don't close if interacting with MathLive virtual keyboard, math modals or toggle buttons
      if (
        target.closest?.('[data-math-keyboard-modal="true"]') ||
        target.closest?.('[class*="MLK__"]') ||
        target.closest?.('math-field') ||
        target.closest?.('[data-explanation-toggle="true"]') ||
        target.tagName?.toLowerCase() === 'math-field'
      ) {
        return
      }

      onClose()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Strip HTML tags to get pure text for length check
  const plainTextLength = explanation.replace(/<[^>]*>?/gm, '').trim().length
  const isValid = plainTextLength > 0

  const handleSubmit = () => {
    if (isValid) {
      onSubmit(explanation)
      setExplanation('') // Reset for next time
    }
  }

  const handleClose = () => {
    setExplanation('')
    onClose()
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs sm:hidden z-[99] pointer-events-auto"
        aria-hidden="true"
        onClick={handleClose}
      />

      <div className="fixed inset-x-3 bottom-4 sm:bottom-auto sm:inset-x-auto sm:top-24 sm:right-8 z-[100] flex flex-col w-auto sm:w-[400px] max-w-[calc(100vw-24px)] pointer-events-none">
        {/* Panel Container */}
        <div 
          ref={containerRef}
          data-testid="explanation-popup-panel"
          className="relative bg-white/95 sm:bg-white/70 backdrop-blur-2xl w-full rounded-2xl sm:rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.08)] border border-slate-200/80 sm:border-white/50 flex flex-col overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] opacity-100 scale-100 pointer-events-auto h-[380px] sm:h-[420px] max-h-[82vh]"
          style={{
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.4)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nhập lời giải thích</span>
            <button 
              type="button"
              onClick={handleClose} 
              aria-label="Đóng" 
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer sm:hidden"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 pb-3 pt-1 flex-grow flex flex-col min-h-0">
            <div className="relative rounded-xl overflow-y-auto border border-slate-200 shadow-inner bg-slate-50/80 flex-1 flex flex-col">
              <RichTextEditor 
                content={explanation}
                onChange={setExplanation}
                placeholder="Nhập lời giải thích..."
                minHeight="100%"
                className="flex-1"
                smallToolbar={true}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-slate-50/80 backdrop-blur-md flex items-center justify-between border-t border-slate-100 shrink-0">
            <button 
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-white/70 hover:bg-slate-100 transition-all text-sm flex-1 mr-2 border border-slate-200 cursor-pointer"
            >
              Hủy
            </button>
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={!isValid}
              className="px-4 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-all shadow-sm shadow-primary/25 flex items-center justify-center gap-2 text-sm flex-1 ml-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Lưu
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

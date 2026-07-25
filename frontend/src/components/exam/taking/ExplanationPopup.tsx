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

  useEffect(() => {
    if (isOpen) {
      setExplanation(initialExplanation || '')
    }
  }, [isOpen, initialExplanation])

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
    <div className="fixed top-24 right-8 z-[100] flex flex-col w-[400px] pointer-events-none">
      {/* Panel Container */}
      <div 
        className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl w-full rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] border border-white/50 dark:border-slate-800/50 flex flex-col overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] opacity-100 scale-100 ring-1 ring-black/5 pointer-events-auto h-[420px]"
        style={{
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.4)'
        }}
      >
        {/* Body */}
        <div className="p-4 flex-grow flex flex-col min-h-0">
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest text-center">Nhập lời giải thích</label>
          <div className="relative rounded-xl overflow-y-auto border border-slate-200 dark:border-slate-700/50 shadow-inner bg-slate-50/80 dark:bg-slate-800/50 flex-1 flex flex-col">
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
        <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md flex items-center justify-between border-t border-slate-100 dark:border-slate-700/50 shrink-0">
          <button 
            onClick={handleClose}
            className="px-4 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-sm flex-1 mr-2"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!isValid}
            className="px-4 py-2 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-all shadow-sm shadow-primary/25 flex items-center justify-center gap-2 text-sm flex-1 ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Lưu
          </button>
        </div>
      </div>
    </div>
  )
}

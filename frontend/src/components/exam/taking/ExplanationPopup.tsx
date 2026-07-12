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
  const isValid = plainTextLength >= 4

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">Giải thích đáp án</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Hãy nhập lời giải thích (ít nhất 4 ký tự) bao gồm cả công thức toán học nếu cần để xác nhận đáp án.
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 flex-grow flex flex-col overflow-y-auto">
          <RichTextEditor 
            content={explanation}
            onChange={setExplanation}
            placeholder="Nhập lời giải thích..."
            minHeight="200px"
            className="flex-1"
          />
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-between mt-auto">
          <div className="text-sm font-medium text-slate-500">
            {plainTextLength < 4 && <span className="text-red-500">Còn thiếu {4 - plainTextLength} ký tự</span>}
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              Hủy
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!isValid}
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-all shadow-sm shadow-primary/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

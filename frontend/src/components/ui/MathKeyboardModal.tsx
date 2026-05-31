'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Keyboard, CheckCircle2 } from 'lucide-react'
import MathInput from './MathInput'
import MathText from './MathText'

interface MathKeyboardModalProps {
  initialValue: string
  onSave: (latex: string) => void
  onCancel: () => void
}

export default function MathKeyboardModal({ initialValue, onSave, onCancel }: MathKeyboardModalProps) {
  const [latex, setLatex] = useState(initialValue || '')
  
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Keyboard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide">Bàn phím ảo toán học</h2>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Sửa hoặc tạo công thức toán chuyên nghiệp</p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto flex-grow flex flex-col gap-8">
          {/* Editor Section */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Nhập công thức</label>
            <div className="relative">
              <MathInput 
                value={latex}
                onChange={setLatex}
              />
            </div>
          </div>

          {/* Preview Section */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Xem trước công thức</label>
            <div className="min-h-[120px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 flex items-center justify-center relative">
              {latex ? (
                <div className="text-2xl text-slate-800">
                  <MathText content={`$${latex}$`} />
                </div>
              ) : (
                <span className="text-slate-400 italic font-medium">Bắt đầu gõ để xem trước công thức...</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px]">i</span>
            Mẹo: Nhấn Enter để lưu
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={onCancel}
              className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
            >
              HỦY BỎ
            </button>
            <button 
              onClick={() => onSave(latex)}
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-all shadow-sm shadow-primary/25 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              LƯU CÔNG THỨC
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

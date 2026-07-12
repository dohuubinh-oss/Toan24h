import React, { useEffect, useRef } from 'react'
import { Sparkles, X, Lightbulb, CheckCircle2, Lock } from 'lucide-react'
import MathText from '@/components/ui/MathText'

interface AiHintPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function AIHintPanel({ isOpen, onClose }: AiHintPanelProps) {
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const isToggleButton = target instanceof Element && target.closest('[data-hint-toggle="true"]')
      if (isOpen && panelRef.current && !panelRef.current.contains(target) && !isToggleButton) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  return (
    <aside 
      ref={panelRef}
      className={`absolute top-0 bottom-0 right-0 w-[340px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transition-transform duration-500 z-40 flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-white">Trợ lý AI</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-1">Gợi ý 1: Phân tích đề</h4>
              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                Đọc kỹ đề bài và xác định phương pháp giải phù hợp. Nếu là hàm số, xem xét việc tính đạo hàm.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1">Gợi ý 2: Thực hiện các bước</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Áp dụng công thức và tính toán cẩn thận từng bước một.
              </p>
            </div>
          </div>
        </div>

        {/* Locked Hint Placeholder */}
        <div className="relative group overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-10 flex items-center justify-center flex-col gap-2 transition-all">
            <div className="p-3 bg-white/90 dark:bg-slate-800/90 rounded-full shadow-lg">
              <Lock className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <span className="text-white font-medium text-sm drop-shadow-md">Mở khóa gợi ý cuối</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700 blur-[2px] select-none">
            <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
            <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
            <div className="w-5/6 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    </aside>
  )
}

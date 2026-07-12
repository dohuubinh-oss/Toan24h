import React from 'react'
import { ChevronLeft, ChevronRight, Send } from 'lucide-react'

interface ExamTakeFooterProps {
  onPrev: () => void
  onNext: () => void
  onSubmit: () => void
  canGoPrev: boolean
  canGoNext: boolean
  answeredCount: number
  totalCount: number
}

export default function ExamTakeFooter({
  onPrev,
  onNext,
  onSubmit,
  canGoPrev,
  canGoNext,
  answeredCount,
  totalCount,
}: ExamTakeFooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-6 z-[100] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onPrev}
            disabled={!canGoPrev}
            className="flex items-center gap-2 px-5 py-3 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Câu trước
          </button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className="flex items-center gap-2 px-5 py-3 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Câu tiếp theo
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-6">
          <p className="hidden sm:block text-slate-500 dark:text-slate-400 text-sm font-medium">
            Bạn đã trả lời {answeredCount}/{totalCount} câu hỏi
          </p>
          <button
            onClick={onSubmit}
            className="bg-primary hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all flex items-center gap-2 active:scale-95"
          >
            Nộp bài
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </footer>
  )
}

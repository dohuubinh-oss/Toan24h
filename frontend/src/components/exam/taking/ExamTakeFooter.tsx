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
    <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2.5 py-2 sm:px-6 sm:py-3.5 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Navigation buttons */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onPrev}
            disabled={!canGoPrev}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 text-slate-700 font-semibold hover:bg-slate-100 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm whitespace-nowrap cursor-pointer shrink-0"
            aria-label="Câu trước"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="hidden sm:inline">Câu trước</span>
            <span className="sm:hidden">Trước</span>
          </button>
          <div className="h-5 sm:h-6 w-px bg-slate-200 shrink-0" aria-hidden="true" />
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 text-slate-700 font-semibold hover:bg-slate-100 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm whitespace-nowrap cursor-pointer shrink-0"
            aria-label="Câu tiếp theo"
          >
            <span className="hidden sm:inline">Câu tiếp theo</span>
            <span className="sm:hidden">Tiếp</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          </button>
        </div>

        {/* Status & Submit button */}
        <div className="flex items-center gap-1.5 sm:gap-5 shrink-0">
          <p className="hidden md:block text-slate-500 text-xs sm:text-sm font-medium">
            Bạn đã trả lời {answeredCount}/{totalCount} câu hỏi
          </p>
          <span className="text-xs text-slate-500 font-semibold sm:hidden">
            {answeredCount}/{totalCount}
          </span>
          <span className="hidden sm:inline md:hidden text-xs text-slate-500 font-semibold">
            {answeredCount}/{totalCount} câu
          </span>
          <button
            type="button"
            onClick={onSubmit}
            className="bg-primary hover:bg-blue-700 text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold shadow-md shadow-primary/25 transition-all flex items-center gap-1.5 sm:gap-2 active:scale-95 text-xs sm:text-sm whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Nộp bài</span>
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          </button>
        </div>
      </div>
    </footer>
  )
}

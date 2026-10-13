'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, Trash2, BookmarkCheck, X, CheckSquare, Square } from 'lucide-react'

export interface OrphanQuestion {
  id: string
  bookName?: string
  content: string
}

interface ConfirmDeleteOrphanModalProps {
  isOpen: boolean
  orphanQuestions: OrphanQuestion[]
  onConfirmDelete: (selectedQuestionIds: string[]) => void
  onKeepInBank: () => void
  onClose: () => void
  isSubmitting?: boolean
}

export default function ConfirmDeleteOrphanModal({
  isOpen,
  orphanQuestions,
  onConfirmDelete,
  onKeepInBank,
  onClose,
  isSubmitting = false,
}: ConfirmDeleteOrphanModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // By default, select all orphan questions
  useEffect(() => {
    if (isOpen && orphanQuestions.length > 0) {
      setSelectedIds(orphanQuestions.map(q => q.id))
    }
  }, [isOpen, orphanQuestions])

  if (!isOpen) return null

  const allSelected = selectedIds.length === orphanQuestions.length && orphanQuestions.length > 0

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(orphanQuestions.map(q => q.id))
    }
  }

  const handleToggleOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start gap-4 bg-amber-50/60">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 pr-2">
            <h3 className="font-bold text-slate-900 text-lg">
              Phát hiện câu hỏi không còn thuộc đề thi nào
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Các câu hỏi sau đã được gỡ khỏi đề thi này và hiện không còn được dùng trong bất kỳ đề thi hoặc bài luyện tập nào khác trong hệ thống.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content & Question Checklist */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium pb-1 border-b border-slate-100">
            <span>Chọn các câu hỏi bạn muốn xóa khỏi ngân hàng câu hỏi:</span>
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="text-primary hover:underline font-semibold flex items-center gap-1"
            >
              {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {orphanQuestions.map((q, idx) => {
              const isChecked = selectedIds.includes(q.id)
              return (
                <label
                  key={q.id}
                  htmlFor={`orphan-q-${q.id}`}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    isChecked
                      ? 'border-red-200 bg-red-50/40 text-slate-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <input
                    id={`orphan-q-${q.id}`}
                    type="checkbox"
                    aria-label={q.bookName || `Câu hỏi ${idx + 1}`}
                    checked={isChecked}
                    onChange={() => handleToggleOne(q.id)}
                    className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm flex items-center gap-2">
                      <span className="truncate">{q.bookName || `Câu hỏi ${idx + 1}`}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 font-normal">
                      {q.content.replace(/<[^>]*>?/gm, '')}
                    </p>
                  </div>
                </label>
              )
            })}
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
            💡 <strong>Mẹo:</strong> Nếu bạn chỉ muốn gỡ câu hỏi khỏi đề thi này mà vẫn muốn giữ lại trong ngân hàng câu hỏi để dùng sau, hãy chọn <em>"Giữ lại toàn bộ trong ngân hàng"</em>.
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors order-3 sm:order-1"
          >
            Hủy
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              onClick={onKeepInBank}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <BookmarkCheck className="w-4 h-4 text-slate-500" />
              Giữ lại toàn bộ trong ngân hàng
            </button>

            <button
              type="button"
              onClick={() => onConfirmDelete(selectedIds)}
              disabled={isSubmitting || selectedIds.length === 0}
              className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              {selectedIds.length > 0
                ? `Xóa ${selectedIds.length} câu đã chọn khỏi ngân hàng`
                : 'Xóa câu đã chọn khỏi ngân hàng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

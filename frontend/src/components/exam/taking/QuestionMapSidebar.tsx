import React, { useState } from 'react'
import { X, LayoutGrid, Map } from 'lucide-react'

export type QuestionStatus = 'done' | 'current' | 'unfinished'

export interface QuestionMapItem {
  id: number
  status: QuestionStatus
  isFlagged: boolean
}

interface QuestionMapSidebarProps {
  questions: QuestionMapItem[]
  onSelectQuestion: (id: number) => void
  onSubmit: () => void
}

export default function QuestionMapSidebar({ questions, onSelectQuestion, onSubmit }: QuestionMapSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`fixed top-0 right-0 h-full flex items-center z-[60] transition-transform duration-400 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <button
        data-testid="qmap-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="absolute left-[-40px] w-10 h-24 bg-white dark:bg-slate-900 border border-r-0 border-slate-200 dark:border-slate-800 rounded-l-xl shadow-lg flex items-center justify-center hover:w-12 active:scale-95 transition-all cursor-pointer"
        aria-label="Toggle Question Map"
      >
        <div className="text-slate-500 dark:text-slate-400 select-none">
          {isOpen ? <X className="w-6 h-6" /> : <LayoutGrid className="w-6 h-6" />}
        </div>
      </button>

      <aside className="h-full w-[320px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Map className="w-5 h-5 text-primary" />
            Bản đồ câu hỏi
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-colors text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-5 gap-3">
            {questions.map((q) => {
              let btnClass = ''
              if (q.status === 'done') {
                btnClass = 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800/50'
              } else if (q.status === 'current') {
                btnClass = 'bg-primary text-white shadow-md shadow-primary/30 ring-4 ring-primary/20'
              } else {
                btnClass = 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
              }
              // If flagged, it overrides 'unfinished' styles slightly based on design, but let's keep it simple or apply amber style.
              // Wait, the HTML example had amber for flagged/thinking.
              if (q.isFlagged && q.status !== 'current' && q.status !== 'done') {
                btnClass = 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
              }

              return (
                <div
                  key={q.id}
                  onClick={() => onSelectQuestion(q.id)}
                  className={`relative w-full aspect-square flex items-center justify-center rounded-lg font-bold text-sm cursor-pointer transition-all hover:scale-110 ${btnClass}`}
                >
                  {q.id}
                  {q.isFlagged && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-8 space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chú thích</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 border border-green-200"></div>
                <span>Đã hoàn thành</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="w-4 h-4 rounded bg-primary"></div>
                <span>Đang làm</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/30 border border-amber-200"></div>
                <span>Đang phân vân</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200"></div>
                <span>Chưa làm</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto p-6 bg-slate-50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onSubmit}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all active:scale-95"
          >
            Nộp bài ngay
          </button>
        </div>
      </aside>
    </div>
  )
}

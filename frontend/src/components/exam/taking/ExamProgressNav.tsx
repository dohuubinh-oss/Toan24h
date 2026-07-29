import React from 'react'
import { ArrowLeft, Timer, Coins } from 'lucide-react'

interface ExamProgressNavProps {
  title: string
  subject: string
  completedQuestions: number
  totalQuestions: number
  timeLeft?: string
  examType?: string
  points?: number
  onBack: () => void
}

export default function ExamProgressNav({
  title,
  subject,
  completedQuestions,
  totalQuestions,
  timeLeft = '00:00',
  examType = 'exam',
  points = 0,
  onBack,
}: ExamProgressNavProps) {
  const progressPercent = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            aria-label="Trở lại"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              {subject}
            </p>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-8 flex flex-col gap-2">
          <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Tiến độ hoàn thành: {completedQuestions}/{totalQuestions} câu</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {examType === 'exam' ? (
          <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl border border-red-100 dark:border-red-900/30">
            <Timer className="w-5 h-5 text-red-500 animate-pulse" />
            <span className="text-red-600 dark:text-red-400 font-bold tabular-nums text-lg">
              {timeLeft}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-xl border border-amber-100 dark:border-amber-900/30">
            <Coins className="w-5 h-5 text-amber-500" />
            <span className="text-amber-600 dark:text-amber-400 font-bold tabular-nums text-lg">
              {points} điểm
            </span>
          </div>
        )}
      </div>
    </nav>
  )
}

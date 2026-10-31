import React from 'react'
import { ArrowLeft, Timer, Award, Coins } from 'lucide-react'

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
  points,
  onBack,
}: ExamProgressNavProps) {
  const progressPercent = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Back button & Exam title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <button
            onClick={onBack}
            aria-label="Trở lại"
            className="p-1.5 sm:p-2 -ml-1 hover:bg-slate-100 rounded-full transition-colors text-slate-600 shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="min-w-0">
            <h1 
              className="text-sm sm:text-lg font-bold text-slate-900 truncate max-w-[130px] xs:max-w-[180px] sm:max-w-xs md:max-w-md"
              title={title}
            >
              {title}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold truncate">
              {subject}
            </p>
          </div>
        </div>

        {/* Center: Desktop Progress Bar */}
        {examType !== 'result' && (
          <div className="hidden md:flex flex-1 max-w-md mx-6 flex-col gap-1.5 shrink-0">
            <div className="flex justify-between text-xs font-semibold text-slate-500">
              <span>Tiến độ hoàn thành: {completedQuestions}/{totalQuestions} câu</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Right: Points & Timer */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {examType !== 'result' ? (
            <>
              {points !== undefined && (
                <div className="hidden sm:flex items-center gap-1.5 bg-amber-50 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-amber-200 shadow-xs">
                  <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" />
                  <span className="text-amber-700 font-bold tabular-nums text-xs sm:text-sm">
                    {points} xu
                  </span>
                </div>
              )}
              {examType === 'exam' && (
                <div className="flex items-center gap-1.5 sm:gap-2.5 bg-red-50 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-red-200 shadow-xs shrink-0">
                  <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 animate-pulse shrink-0" />
                  <span className="text-red-600 font-bold tabular-nums text-sm sm:text-base tracking-tight">
                    {timeLeft}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-blue-50 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-blue-100 text-blue-700 font-bold text-xs sm:text-base shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
              <span>{timeLeft}</span>
            </div>
          )}
        </div>
      </div>

      {/* Slim progress bar on mobile */}
      {examType !== 'result' && (
        <div className="md:hidden h-1 w-full bg-slate-100 overflow-hidden" aria-hidden="true">
          <div 
            className="bg-primary h-full transition-all duration-300" 
            style={{ width: `${progressPercent}%` }} 
          />
        </div>
      )}
    </nav>
  )
}

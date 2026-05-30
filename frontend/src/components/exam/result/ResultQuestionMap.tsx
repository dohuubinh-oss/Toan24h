import React from 'react'
import { LayoutGrid } from 'lucide-react'

export interface ResultMCQuestion {
  id: number
  isCorrect: boolean
  type: 'mc'
}

export interface ResultEssayQuestion {
  id: number
  score: number
  isWarning: boolean
  type: 'essay'
}

interface ResultQuestionMapProps {
  mcQuestions: ResultMCQuestion[]
  essayQuestions: ResultEssayQuestion[]
  totalQuestions: number
  onSelectQuestion: (id: number) => void
}

export default function ResultQuestionMap({
  mcQuestions,
  essayQuestions,
  totalQuestions,
  onSelectQuestion,
}: ResultQuestionMapProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <LayoutGrid className="w-6 h-6 text-primary" />
          Bản đồ câu hỏi
        </h3>
        <span className="text-xs font-medium text-slate-400">{totalQuestions} Câu hỏi</span>
      </div>
      
      <div className="space-y-6">
        {mcQuestions.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Trắc nghiệm</p>
            <div className="flex flex-wrap gap-2">
              {mcQuestions.map((q) => {
                const btnClass = q.isCorrect
                  ? 'bg-success/10 text-success border-success/20'
                  : 'bg-error/10 text-error border-error/20'
                
                return (
                  <button
                    key={q.id}
                    onClick={() => onSelectQuestion(q.id)}
                    className={`w-12 h-12 rounded-lg border flex items-center justify-center font-bold text-sm hover:scale-105 transition-transform shadow-sm hover:shadow-md ${btnClass}`}
                  >
                    {q.id}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {essayQuestions.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tự luận</p>
            <div className="flex flex-wrap gap-2">
              {essayQuestions.map((q) => {
                const btnClass = q.isWarning
                  ? 'bg-warning/10 text-warning border-warning/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                
                return (
                  <button
                    key={q.id}
                    onClick={() => onSelectQuestion(q.id)}
                    className={`px-4 h-12 rounded-lg border flex items-center justify-center gap-1 font-bold text-sm hover:scale-105 transition-transform shadow-sm hover:shadow-md ${btnClass}`}
                  >
                    {q.id} <span className="text-xs font-normal opacity-70">({q.score.toFixed(1)}đ)</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

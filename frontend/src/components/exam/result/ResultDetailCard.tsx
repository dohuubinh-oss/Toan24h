import React from 'react'
import { Circle, CheckCircle, XCircle, Brain } from 'lucide-react'

interface Option {
  id: string
  text: string
}

interface ResultDetailCardProps {
  questionId: number
  content: React.ReactNode
  type: 'mc' | 'essay'
  
  // For MC
  options?: Option[]
  selectedOptionId?: string
  correctOptionId?: string
  isCorrect?: boolean
  
  // For Essay
  studentAnswer?: React.ReactNode
  score?: number
  maxScore?: number
  
  // Common
  aiExplanation?: React.ReactNode
}

export default function ResultDetailCard({
  questionId,
  content,
  type,
  options,
  selectedOptionId,
  correctOptionId,
  isCorrect,
  studentAnswer,
  score,
  maxScore,
  aiExplanation
}: ResultDetailCardProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm">
              {questionId}
            </span>
            <div className="space-y-4 w-full">
              <div className="font-semibold text-base">{content}</div>
              
              {type === 'mc' && options && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {options.map((opt) => {
                    const isSelected = opt.id === selectedOptionId
                    const isRightAnswer = opt.id === correctOptionId

                    let btnClass = 'border-slate-200 dark:border-slate-700'
                    let label = `${opt.id}. ${opt.text}`
                    let iconColor = 'text-slate-300'
                    let icon = <Circle className={`w-5 h-5 ${iconColor}`} />

                    if (isSelected && isRightAnswer) {
                      btnClass = 'border-2 border-success bg-success/5 font-bold text-success'
                      label = `${opt.id}. ${opt.text} (Lựa chọn của bạn & Đáp án đúng)`
                      iconColor = 'text-success'
                      icon = <CheckCircle className={`w-5 h-5 ${iconColor}`} />
                    } else if (isSelected && !isRightAnswer) {
                      btnClass = 'border-2 border-error bg-error/5 font-bold text-error'
                      label = `${opt.id}. ${opt.text} (Lựa chọn của bạn)`
                      iconColor = 'text-error'
                      icon = <XCircle className={`w-5 h-5 ${iconColor}`} />
                    } else if (!isSelected && isRightAnswer) {
                      btnClass = 'border-2 border-success bg-success/5 font-bold text-success'
                      label = `${opt.id}. ${opt.text} (Đáp án đúng)`
                      iconColor = 'text-success'
                      icon = <CheckCircle className={`w-5 h-5 ${iconColor}`} />
                    }

                    return (
                      <div key={opt.id} className={`p-4 rounded-lg border text-sm flex items-center justify-between ${btnClass}`}>
                        <span>{label}</span>
                        {icon}
                      </div>
                    )
                  })}
                </div>
              )}

              {type === 'essay' && studentAnswer && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 mt-4">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Bài làm của bạn:</p>
                  <div className="text-sm">{studentAnswer}</div>
                </div>
              )}
            </div>
          </div>
          
          {type === 'mc' && (
            <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold border ${isCorrect ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'}`}>
              {isCorrect ? 'Đúng' : 'Sai'}
            </span>
          )}

          {type === 'essay' && score !== undefined && maxScore !== undefined && (
            <span className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold bg-warning/10 text-warning border border-warning/20">
              {score.toFixed(1)} / {maxScore.toFixed(1)}đ
            </span>
          )}
        </div>
      </div>
      
      {aiExplanation && (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary p-1.5 rounded-md mt-0.5">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold mb-1">Giải thích từ AI</p>
              <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {aiExplanation}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

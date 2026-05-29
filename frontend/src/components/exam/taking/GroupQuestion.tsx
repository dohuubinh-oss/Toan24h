import React from 'react'
import MultipleChoiceQuestion from './MultipleChoiceQuestion'
import EssayQuestion from './EssayQuestion'

export interface SubQuestion {
  id: number
  type: 'mc' | 'essay'
  content: React.ReactNode
  options?: { id: string, text: string }[] // For MC
}

interface GroupQuestionProps {
  id: number
  sharedContext: React.ReactNode
  subQuestions: SubQuestion[]
  answers: Record<number, string>
  onAnswerChange: (subQuestionId: number, answer: string) => void
}

export default function GroupQuestion({
  id,
  sharedContext,
  subQuestions,
  answers,
  onAnswerChange
}: GroupQuestionProps) {
  return (
    <div className="space-y-8">
      {/* Shared Context Block */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-800 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg uppercase tracking-wider">
              Câu hỏi chùm {id}
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-xs italic font-semibold">
              • Đọc kỹ ngữ liệu sau để trả lời các câu hỏi bên dưới
            </span>
          </div>
          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-100 leading-relaxed">
            {sharedContext}
          </div>
        </div>
      </div>

      {/* Sub Questions List */}
      <div className="space-y-6">
        {subQuestions.map((q, index) => (
          <div key={q.id} className="ml-0 md:ml-8 border-l-2 border-slate-100 dark:border-slate-800 pl-0 md:pl-6">
            <h4 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">
              Câu {index + 1}
            </h4>
            {q.type === 'mc' ? (
              <MultipleChoiceQuestion
                questionId={q.id}
                content={q.content as string}
                options={q.options || []}
                selectedOptionId={answers[q.id] || null}
                isFlagged={false}
                onSelectOption={(optId) => onAnswerChange(q.id, optId)}
                onToggleFlag={() => {}}
              />
            ) : (
              <EssayQuestion
                questionId={q.id}
                content={q.content as string}
                answer={answers[q.id] || ''}
                isFlagged={false}
                onAnswerChange={(val) => onAnswerChange(q.id, val)}
                onToggleFlag={() => {}}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

import React from 'react'
import { ListOrdered, CheckCircle2 } from 'lucide-react'
import { Question } from '../../types/question'
import QuestionCard from './QuestionCard'

interface ExamQuestionListProps {
  questions: Question[];
}

export default function ExamQuestionList({ questions }: ExamQuestionListProps) {
  const multipleChoiceQuestions = questions.filter(q => q.type !== 'Tự luận');
  const essayQuestions = questions.filter(q => q.type === 'Tự luận');

  return (
    <div className="lg:col-span-8 space-y-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ListOrdered className="text-primary w-6 h-6" />
          Danh sách câu hỏi ({questions.length} câu)
        </h2>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Đã kiểm tra {questions.length}/{questions.length}
          </span>
        </div>
      </div>

      {multipleChoiceQuestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 py-2 border-l-4 border-primary pl-4 bg-white rounded-r-xl">
            <h3 className="text-lg font-extrabold uppercase tracking-tight">Phần 1: Trắc nghiệm</h3>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{multipleChoiceQuestions.length} câu</span>
          </div>
          {multipleChoiceQuestions.map((q, idx) => (
            <QuestionCard key={`mcq-${idx}`} question={q} index={idx} />
          ))}
        </div>
      )}

      {essayQuestions.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-3 py-2 border-l-4 border-amber-500 pl-4 bg-white rounded-r-xl">
            <h3 className="text-lg font-extrabold uppercase tracking-tight">Phần 2: Tự luận</h3>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{essayQuestions.length} câu</span>
          </div>
          {essayQuestions.map((q, idx) => (
            <QuestionCard key={`essay-${idx}`} question={q} index={multipleChoiceQuestions.length + idx} />
          ))}
        </div>
      )}
    </div>
  )
}

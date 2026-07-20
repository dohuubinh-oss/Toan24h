import React from 'react'
import { ListOrdered, CheckCircle2 } from 'lucide-react'
import { Question } from '../../types/question'
import QuestionCard from '../questions/QuestionCard'
import ContentQuestion from '../questions/ContentQuestion'

interface ExamQuestionListProps {
  questions: Question[];
  onRemoveQuestion?: (id: string) => void;
}

export default function ExamQuestionList({ questions, onRemoveQuestion }: ExamQuestionListProps) {
  const difficultyWeight: Record<string, number> = {
    'Nhận biết': 1,
    'Thông hiểu': 2,
    'Vận dụng': 3,
    'Vận dụng cao': 4
  };

  const sortByDifficulty = (a: Question, b: Question) => {
    const wA = difficultyWeight[a.difficulty_level || 'Nhận biết'] || 1;
    const wB = difficultyWeight[b.difficulty_level || 'Nhận biết'] || 1;
    return wA - wB;
  };

  const multipleChoiceQuestions = questions
    .filter(q => q.type !== 'Tự luận' && q.type_question !== 'group')
    .sort(sortByDifficulty);
    
  const essayQuestions = questions
    .filter(q => q.type === 'Tự luận' || q.type_question === 'group')
    .sort(sortByDifficulty);

  return (
    <div className="lg:col-span-8 space-y-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ListOrdered className="text-primary w-6 h-6" />
          Danh sách câu hỏi ({questions.length} câu)
        </h2>
      </div>

      {multipleChoiceQuestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 py-2 border-l-4 border-primary pl-4 bg-white rounded-r-xl">
            <h3 className="text-lg font-extrabold uppercase tracking-tight">Phần 1: Trắc nghiệm</h3>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{multipleChoiceQuestions.length} câu</span>
          </div>
          {multipleChoiceQuestions.map((q, idx) => (
            <QuestionCard 
              key={`mcq-${idx}`} 
              id={q.id || `Q-${idx}`}
              grade={q.grade || 12}
              topic={q.topic || 'Chưa phân loại'}
              difficulty={q.difficulty_level || 'Nhận biết'}
              index={idx}
              onDelete={onRemoveQuestion ? () => onRemoveQuestion(q.id) : undefined}
            >
              <ContentQuestion
                content={q.content}
                options={q.options}
                correctAnswer={q.correct_answer}
                solution={q.solution_guide || ''}
                isEssay={false}
              />
            </QuestionCard>
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
            <QuestionCard 
              key={`essay-${idx}`} 
              id={q.id || `Q-E${idx}`}
              grade={q.grade || (q.type_question === 'group' && q.subQuestions?.[0]?.grade ? Number(q.subQuestions[0].grade) : 12)}
              topic={q.topic || (q.type_question === 'group' && q.subQuestions?.[0]?.topic) || 'Chưa phân loại'}
              difficulty={q.difficulty_level || (q.type_question === 'group' && q.subQuestions?.[0]?.difficulty_level) || 'Vận dụng'}
              typeQuestion={q.type_question}
              type={q.type || (q.type_question === 'group' && q.subQuestions?.[0]?.type) || ''}
              index={multipleChoiceQuestions.length + idx}
              onDelete={onRemoveQuestion ? () => onRemoveQuestion(q.id) : undefined}
            >
              <ContentQuestion
                content={q.type_question === 'single' ? q.content : undefined}
                sharedContext={q.type_question === 'group' ? q.content : undefined}
                options={q.options?.length > 0 ? q.options : undefined}
                correctAnswer={q.correct_answer}
                solution={q.solution_guide || ''}
                isEssay={q.type === 'Tự luận'}
                subQuestions={
                  q.type_question === 'group' && q.subQuestions
                    ? q.subQuestions.map(sub => ({
                        content: sub.content,
                        options: sub.options?.length > 0 ? sub.options : undefined,
                        correctAnswer: sub.correct_answer,
                        solution: sub.solution_guide,
                        isEssay: sub.type === 'Tự luận'
                      }))
                    : undefined
                }
              />
            </QuestionCard>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import ExamProgressNav from '@/components/exam/taking/ExamProgressNav'
import QuestionMapSidebar from '@/components/exam/taking/QuestionMapSidebar'
import MultipleChoiceQuestion from '@/components/exam/taking/MultipleChoiceQuestion'
import EssayQuestion from '@/components/exam/taking/EssayQuestion'
import GroupQuestion, { SubQuestion } from '@/components/exam/taking/GroupQuestion'

// Dummy data for testing
const examData = {
  id: '1',
  title: 'Đề kiểm tra 15 phút Toán 12',
  duration: 15 * 60, // 15 minutes in seconds
  questions: [
    {
      id: 1,
      type: 'mc' as const,
      content: 'Tìm giá trị cực đại của hàm số $y = x^3 - 3x + 2$ trên đoạn $[0, 2]$.',
      options: [
        { id: 'A', text: '0' },
        { id: 'B', text: '2' },
        { id: 'C', text: '4' },
        { id: 'D', text: '6' },
      ],
    },
    {
      id: 2,
      type: 'essay' as const,
      content: 'Cho tam giác ABC vuông tại A, có đường cao AH. Biết AB = 6cm, AC = 8cm. Tính BC và AH.',
    },
    { 
      id: 3, 
      type: 'group' as const,
      sharedContext: 'Cho hàm số $y = x^3 - 3x^2 + 2$ có đồ thị (C).',
      subQuestions: [
        { id: 31, type: 'mc', content: 'Tọa độ điểm cực đại của (C) là:', options: [
          { id: 'A', text: '(0; 2)' },
          { id: 'B', text: '(2; -2)' },
          { id: 'C', text: '(0; -2)' },
          { id: 'D', text: '(2; 2)' }
        ] },
        { id: 32, type: 'essay', content: 'Viết phương trình tiếp tuyến của (C) tại điểm có hoành độ $x = 1$.' }
      ] as SubQuestion[]
    }
  ]
}

export default function ExamTakePage({ params }: { params: { id: string } }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [isMapOpen, setIsMapOpen] = useState(false)

  const currentQuestion = examData.questions[currentQuestionIndex]

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const mapQuestions = examData.questions.map((q, idx) => {
    const isAnswered = !!answers[q.id] || (q.type === 'group' && q.subQuestions.some((sub: any) => !!answers[sub.id]))
    const isCurrent = idx === currentQuestionIndex
    let status: 'done' | 'current' | 'unfinished' = 'unfinished'
    if (isCurrent) status = 'current'
    else if (isAnswered) status = 'done'
    
    return {
      id: q.id,
      status,
      isFlagged: false // Could add flagging feature
    }
  })

  const handleSubmit = () => {
    // Navigate to results
    window.location.href = `/exam/${params.id}/result`
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <ExamProgressNav 
          title="Đề Thi Khảo Sát Năng Lực"
          subject="Toán Học"
          completedQuestions={Object.keys(answers).length}
          totalQuestions={examData.questions.length}
          timeLeft="45:00"
          onBack={() => {}}
        />

        <div className="flex-1 overflow-y-auto p-6 md:p-12 flex justify-center">
          <div className="w-full max-w-3xl">
            {currentQuestion.type === 'mc' ? (
              <MultipleChoiceQuestion 
                questionId={currentQuestion.id}
                content={currentQuestion.content as string}
                options={currentQuestion.options!}
                selectedOptionId={answers[currentQuestion.id] || null}
                isFlagged={false}
                onSelectOption={(optId) => handleAnswerSelect(currentQuestion.id, optId)}
                onToggleFlag={() => {}}
              />
            ) : currentQuestion.type === 'essay' ? (
              <EssayQuestion 
                questionId={currentQuestion.id}
                content={currentQuestion.content as string}
                answer={answers[currentQuestion.id] || ''}
                isFlagged={false}
                onAnswerChange={(val) => handleAnswerSelect(currentQuestion.id, val)}
                onToggleFlag={() => {}}
              />
            ) : (
              <GroupQuestion
                id={currentQuestion.id}
                sharedContext={currentQuestion.sharedContext}
                subQuestions={currentQuestion.subQuestions}
                answers={answers}
                onAnswerChange={handleAnswerSelect}
              />
            )}
            
            <div className="flex justify-between mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
              <button 
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold disabled:opacity-50"
              >
                Câu trước
              </button>
              
              {currentQuestionIndex < examData.questions.length - 1 ? (
                <button 
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(examData.questions.length - 1, prev + 1))}
                  className="px-6 py-2 rounded-xl bg-primary text-white font-semibold shadow-lg shadow-primary/20"
                >
                  Câu tiếp theo
                </button>
              ) : (
                <button 
                  onClick={handleSubmit}
                  className="px-6 py-2 rounded-xl bg-success text-white font-semibold shadow-lg shadow-success/20"
                >
                  Nộp bài
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map Sidebar */}
      <QuestionMapSidebar 
        questions={mapQuestions}
        onSelectQuestion={(id) => {
          const idx = examData.questions.findIndex(q => q.id === id)
          if (idx !== -1) {
            setCurrentQuestionIndex(idx)
          }
        }}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

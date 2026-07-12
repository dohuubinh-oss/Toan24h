'use client'

import React, { useState } from 'react'
import ExamProgressNav from '@/components/exam/taking/ExamProgressNav'
import QuestionMapSidebar from '@/components/exam/taking/QuestionMapSidebar'
import MultipleChoiceQuestion from '@/components/exam/taking/MultipleChoiceQuestion'
import EssayQuestion from '@/components/exam/taking/EssayQuestion'
import { SubQuestion } from '@/components/exam/taking/EssayQuestion'
import ExamTakeFooter from '@/components/exam/taking/ExamTakeFooter'
import AIHintPanel from '@/components/exam/taking/AIHintPanel'

// Dummy data for testing
const examData = {
  id: '1',
  title: 'Đề kiểm tra 15 phút Toán 12',
  duration: 15 * 60, // 15 minutes in seconds
  questions: [
    {
      id: 1,
      type: 'mc' as const,
      topic: 'Phương trình bậc hai',
      content: 'Giải phương trình sau: $x^2 - 5x + 6 = 0$',
      options: [
        { id: 'A', text: '$x = 2; x = 3$' },
        { id: 'B', text: '$x = -2; x = -3$' },
        { id: 'C', text: '$x = 1; x = 6$' },
        { id: 'D', text: '$x = -1; x = -6$' },
      ],
    },
    {
      id: 2,
      type: 'essay' as const,
      topic: 'Tính độ dài đường cao trong tam giác',
      content: 'Cho tam giác ABC vuông tại A, có đường cao AH. Biết AB = 6cm, AC = 8cm. Tính BC và AH.',
    },
    { 
      id: 3, 
      type: 'group' as const,
      sharedContext: 'Cho hàm số $y = x^3 - 3x^2 + 2$ có đồ thị (C).',
      subQuestions: [
        { id: 31, type: 'mc', content: 'Tọa độ điểm cực đại của (C) là:', options: [
          { id: 'A', text: '$(0; 2)$' },
          { id: 'B', text: '$(2; -2)$' },
          { id: 'C', text: '$(0; -2)$' },
          { id: 'D', text: '$(2; 2)$' }
        ] },
        { id: 32, type: 'essay', content: 'Viết phương trình tiếp tuyến của (C) tại điểm có hoành độ $x = 1$.' }
      ] as SubQuestion[]
    }
  ]
}

export default function ExamTakePage({ params }: { params: { id: string } }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [explanations, setExplanations] = useState<Record<number, string>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({})
  const [isAiHintOpen, setIsAiHintOpen] = useState(false)

  const currentQuestion = examData.questions[currentQuestionIndex]

  const handleAnswerSelect = (questionId: number, answer: string, explanation?: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
    if (explanation) {
      setExplanations(prev => ({ ...prev, [questionId]: explanation }))
    }
  }

  const handleToggleFlag = (questionId: number) => {
    setFlaggedQuestions(prev => ({ ...prev, [questionId]: !prev[questionId] }))
  }

  const mapQuestions = examData.questions.map((q, idx) => {
    const isAnswered = !!answers[q.id] || (q.type === 'group' && q.subQuestions.some((sub: any) => !!answers[sub.id]))
    const isCurrent = idx === currentQuestionIndex
    let status: 'done' | 'current' | 'unfinished' = 'unfinished'
    if (isCurrent) status = 'current'
    else if (isAnswered) status = 'done'
    
    // For group questions, check if any subquestion is flagged or the group itself is flagged.
    // Assuming flagging subquestions flags the group visually.
    const isFlagged = !!flaggedQuestions[q.id] || (q.type === 'group' && q.subQuestions.some((sub: any) => !!flaggedQuestions[sub.id]))

    return {
      id: q.id,
      status,
      isFlagged
    }
  })

  const handleSubmit = () => {
    // Navigate to results
    window.location.href = `/exam/${params.id}/result`
  }

  const toggleAiHint = () => {
    setIsAiHintOpen(prev => !prev)
  }

  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden bg-background-light dark:bg-background-dark">
      <ExamProgressNav 
        title={examData.title}
        subject="Toán Lớp 12"
        completedQuestions={Object.keys(answers).length}
        totalQuestions={examData.questions.length}
        timeLeft="45:00"
        onBack={() => {}}
      />

      <div className="flex-1 flex overflow-hidden relative pb-[88px] w-full">
        {currentQuestion.type === 'mc' ? (
          <MultipleChoiceQuestion 
            questionId={currentQuestion.id}
            index={currentQuestionIndex}
            topic={currentQuestion.topic}
            content={currentQuestion.content as string}
            options={currentQuestion.options!}
            selectedOptionId={answers[currentQuestion.id] || null}
            selectedExplanation={explanations[currentQuestion.id]}
            isHintOpen={isAiHintOpen}
            isFlagged={!!flaggedQuestions[currentQuestion.id]}
            onSelectOption={(optId, explanation) => handleAnswerSelect(currentQuestion.id, optId, explanation)}
            onToggleHint={toggleAiHint}
            onToggleFlag={() => handleToggleFlag(currentQuestion.id)}
          />
        ) : (
          <EssayQuestion 
            questionId={currentQuestion.id}
            index={currentQuestionIndex}
            content={currentQuestion.content as string}
            sharedContext={currentQuestion.sharedContext}
            subQuestions={currentQuestion.subQuestions as SubQuestion[]}
            answers={answers}
            explanations={explanations}
            isHintOpen={isAiHintOpen}
            isFlagged={!!flaggedQuestions[currentQuestion.id]}
            onAnswerChange={(id, val, explanation) => handleAnswerSelect(id, val, explanation)}
            onToggleHint={toggleAiHint}
            onToggleFlag={() => handleToggleFlag(currentQuestion.id)}
          />
        )}

        <AIHintPanel 
          isOpen={isAiHintOpen} 
          onClose={() => setIsAiHintOpen(false)} 
        />

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

      <ExamTakeFooter 
        onPrev={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
        onNext={() => setCurrentQuestionIndex(prev => Math.min(examData.questions.length - 1, prev + 1))}
        onSubmit={handleSubmit}
        canGoPrev={currentQuestionIndex > 0}
        canGoNext={currentQuestionIndex < examData.questions.length - 1}
        answeredCount={Object.keys(answers).length}
        totalCount={examData.questions.length}
      />
    </div>
  )
}

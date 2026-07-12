'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Calendar, Timer, LayoutDashboard, CheckCheck } from 'lucide-react'
import ResultScoreCircle from '@/components/exam/result/ResultScoreCircle'
import ResultQuestionMap, { ResultMCQuestion, ResultEssayQuestion } from '@/components/exam/result/ResultQuestionMap'
import ResultDetailCard from '@/components/exam/result/ResultDetailCard'

const resultData = {
  score: 8.5,
  maxScore: 10,
  topPercent: 5,
  multipleChoiceScore: 5.0,
  multipleChoiceMax: 5.0,
  essayScore: 3.5,
  essayMax: 5.0,
  mcQuestions: [
    { id: 1, isCorrect: true, type: 'mc' as const },
    { id: 2, isCorrect: false, type: 'mc' as const },
  ] as ResultMCQuestion[],
  essayQuestions: [
    { id: 3, score: 1.0, isWarning: false, type: 'essay' as const },
    { id: 4, score: 0.5, isWarning: true, type: 'essay' as const },
  ] as ResultEssayQuestion[],
  questionsDetail: [
    {
      id: 1,
      type: 'mc' as const,
      content: 'Giải phương trình $2x = 4$',
      options: [
        { id: 'A', text: '1' },
        { id: 'B', text: '2' },
        { id: 'C', text: '3' },
        { id: 'D', text: '4' },
      ],
      selectedOptionId: 'B',
      correctOptionId: 'B',
      isCorrect: true,
      aiExplanation: 'Ta có $2x = 4 \Rightarrow x = 2$.'
    },
    {
      id: 2,
      type: 'mc' as const,
      content: 'Tìm giá trị cực đại của hàm số $y = x^3 - 3x + 2$ trên đoạn $[0, 2]$.',
      options: [
        { id: 'A', text: '0' },
        { id: 'B', text: '2' },
        { id: 'C', text: '4' },
        { id: 'D', text: '6' },
      ],
      selectedOptionId: 'B',
      correctOptionId: 'C',
      isCorrect: false,
      aiExplanation: 'Đạo hàm $y\' = 3x^2 - 3$. Xét $y\' = 0 \Rightarrow x = 1$ (do $x \in [0, 2]$).\nTính các giá trị: $y(0) = 2$, $y(1) = 0$, $y(2) = 4$.\nVậy giá trị cực đại là 4. Bạn đã nhầm lẫn với $y(0)$ hoặc chưa xét $y(2)$.'
    },
    {
      id: 3,
      type: 'essay' as const,
      content: 'Chứng minh định lý Pythagoras.',
      studentAnswer: 'Trong một tam giác vuông, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông.',
      score: 1.0,
      maxScore: 1.0,
      aiExplanation: 'Bạn đã phát biểu đúng nội dung định lý.'
    },
    {
      id: 4,
      type: 'essay' as const,
      content: 'Cho tam giác ABC vuông tại A, có đường cao AH. Biết AB = 6cm, AC = 8cm. Tính BC và AH.',
      studentAnswer: 'Tính BC = 10, AH = 4.8',
      score: 0.5,
      maxScore: 1.0,
      aiExplanation: 'Bạn tính đúng kết quả nhưng thiếu các bước lập luận áp dụng định lý Pythagoras và hệ thức lượng.'
    }
  ]
}

export default function ExamResultPage({ params }: { params: { id: string } }) {
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="space-y-2">
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <Link href="/dashboard" className="hover:text-primary">Dashboard</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 dark:text-slate-100 font-medium">Kết quả bài thi</span>
          </nav>
          <h1 className="text-3xl font-black tracking-tight leading-none">Kết quả bài thi</h1>
          <p className="text-slate-500 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Hoàn thành lúc: {new Date().toLocaleDateString('vi-VN')}
            <span className="mx-2">|</span>
            <Timer className="w-4 h-4" /> Thời gian làm bài: 45 phút
          </p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm font-semibold"
          >
            <LayoutDashboard className="w-5 h-5" /> Quay lại Dashboard
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <ResultScoreCircle 
            score={resultData.score}
            maxScore={resultData.maxScore}
            topPercent={resultData.topPercent}
            multipleChoiceScore={resultData.multipleChoiceScore}
            multipleChoiceMax={resultData.multipleChoiceMax}
            essayScore={resultData.essayScore}
            essayMax={resultData.essayMax}
          />
          
          <ResultQuestionMap 
            mcQuestions={resultData.mcQuestions}
            essayQuestions={resultData.essayQuestions}
            totalQuestions={resultData.mcQuestions.length + resultData.essayQuestions.length}
            onSelectQuestion={setSelectedQuestionId}
          />
        </div>
        
        <div className="lg:col-span-8 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCheck className="w-6 h-6 text-success" />
                Chi tiết câu hỏi
              </h2>
            </div>
            <div className="space-y-6">
              {resultData.questionsDetail
                .filter(q => selectedQuestionId === null || q.id === selectedQuestionId)
                .map((q) => (
                  <ResultDetailCard 
                    key={q.id}
                    questionId={q.id}
                    type={q.type}
                    content={q.content}
                    options={q.options}
                    selectedOptionId={q.selectedOptionId}
                    correctOptionId={q.correctOptionId}
                    isCorrect={q.isCorrect}
                    studentAnswer={q.studentAnswer}
                    score={q.score}
                    maxScore={q.maxScore}
                    aiExplanation={q.aiExplanation}
                  />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

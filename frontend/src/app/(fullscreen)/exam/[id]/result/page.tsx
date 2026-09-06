'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, Calendar, LayoutDashboard, Loader2, ArrowLeft, ArrowRight, Home } from 'lucide-react'
import ExamWorkspaceLayout from '@/components/exam/ExamWorkspaceLayout'
import QuestionMapSidebar, { QuestionMapItem, QuestionStatus } from '@/components/exam/taking/QuestionMapSidebar'
import MultipleChoiceQuestion from '@/components/exam/taking/MultipleChoiceQuestion'
import EssayQuestion from '@/components/exam/taking/EssayQuestion'
import { getExamResultById } from '@/lib/api'

export default function ExamResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const router = useRouter()
  
  const [resultData, setResultData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isAiHintOpen, setIsAiHintOpen] = useState(false) // Just for layout spacing if needed

  useEffect(() => {
    let interval: NodeJS.Timeout
    const fetchResult = async () => {
      const data = await getExamResultById(id)
      if (data) {
        setResultData(data)
        if (data.status === 'COMPLETED') {
          setLoading(false)
          clearInterval(interval)
        }
      }
    }

    fetchResult()
    
    // Poll every 5s if not completed
    interval = setInterval(() => {
      if (loading) {
        fetchResult()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [id, loading])

  // Memoize mapped data
  const mappedData = useMemo(() => {
    if (!resultData || !resultData.Details) return { questions: [], mapItems: [], answers: {}, explanations: {}, aiFeedbacks: {} }

    const questions: any[] = []
    const mapItems: QuestionMapItem[] = []
    const answers: Record<string, string> = {}
    const explanations: Record<string, string> = {}
    const aiFeedbacks: Record<string, any> = {}

    resultData.Details.forEach((d: any, idx: number) => {
      const isMC = d.Question?.typeQuestion !== 'essay'
      
      const q: any = {
        id: d.questionId,
        type: isMC ? 'Trắc nghiệm' : 'Tự luận',
        type_question: 'single', // Assuming flat for now, grouping can be added if backend supports it
        content: d.Question?.content || `Câu ${idx + 1}`,
        topic: d.Question?.topic,
        options: d.Question?.options ? JSON.parse(d.Question.options || '[]') : [],
        correctAnswer: d.Question?.correctAnswer
      }
      
      questions.push(q)
      
      // Determine Status for Map
      let status: QuestionStatus = 'warning'
      if (isMC) {
        status = d.isCorrect ? 'correct' : 'incorrect'
      } else {
        // Essay heuristic
        if (d.score === 0) status = 'incorrect'
        else if (d.score === (d.Question?.difficultyPoint || 10)) status = 'correct'
        else status = 'warning'
      }

      if (idx === currentQuestionIndex) {
        status = 'current'
      }

      mapItems.push({
        id: d.questionId,
        index: idx,
        status: status,
        isFlagged: false
      })

      answers[d.questionId] = d.studentAnswer || ''
      
      aiFeedbacks[d.questionId] = {
        detailId: d.id,
        isCorrect: d.isCorrect,
        score: d.score,
        maxScore: d.Question?.difficultyPoint || 0,
        aiExplanation: d.aiExplanation,
        errorLocation: d.errorLocation,
        isAppealed: d.isAppealed,
        appealStatus: d.appealStatus,
        teacherFeedback: d.teacherFeedback,
        aiReasoningRemark: d.aiReasoningRemark,
        reasoningScore: d.reasoningScore
      }
    })

    return { questions, mapItems, answers, explanations, aiFeedbacks }
  }, [resultData, currentQuestionIndex])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">AI đang chấm điểm bài làm của bạn...</h2>
        <p className="text-slate-500">Vui lòng chờ trong giây lát.</p>
      </div>
    )
  }

  if (!resultData || mappedData.questions.length === 0) {
    return <div className="text-center py-20 text-slate-500">Không tìm thấy kết quả.</div>
  }

  const currentQuestion = mappedData.questions[currentQuestionIndex]

  // Render header
  const headerContent = (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-30 relative px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Kết quả: {resultData.Exam?.title || 'Bài thi'}
        </h1>
        <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-500">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <span className="text-slate-400">Điểm:</span>
            <span className="text-slate-800 dark:text-slate-200">{resultData.totalScore.toFixed(2)}</span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <span className="text-slate-400">Trắc nghiệm:</span>
            <span className="text-slate-800 dark:text-slate-200">{resultData.mcqScore.toFixed(2)}</span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <span className="text-slate-400">Tự luận:</span>
            <span className="text-slate-800 dark:text-slate-200">{resultData.essayScore.toFixed(2)}</span>
          </span>
          {resultData.overallReasoningRemark && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800/50">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-purple-600 dark:text-purple-400 font-bold">
                Tư duy: {resultData.totalReasoningScore?.toFixed(2)}
              </span>
            </span>
          )}
        </div>
      </div>
      <Link href="/student" className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-sm font-semibold transition-colors">
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Về trang chủ</span>
      </Link>
    </div>
  )

  // Render main content
  const mainContent = currentQuestion ? (
    currentQuestion.type === 'Trắc nghiệm' ? (
      <MultipleChoiceQuestion 
        resultId={resultData?.id}
        questionId={currentQuestion.id}
        index={currentQuestionIndex}
        topic={currentQuestion.topic || ""}
        content={currentQuestion.content}
        options={currentQuestion.options.map((opt: string, i: number) => ({ id: String.fromCharCode(65 + i), text: opt }))}
        selectedOptionId={mappedData.answers[currentQuestion.id] || null}
        correctOptionId={currentQuestion.correctAnswer}
        aiExplanation={mappedData.aiFeedbacks[currentQuestion.id]?.aiExplanation}
        aiFeedback={mappedData.aiFeedbacks[currentQuestion.id]}
        readonly={true}
        isHintOpen={false}
        isFlagged={false}
      />
    ) : (
      <EssayQuestion 
        resultId={resultData?.id}
        questionId={currentQuestion.id}
        index={currentQuestionIndex}
        content={currentQuestion.content}
        answers={mappedData.answers as any}
        explanations={mappedData.explanations as any}
        aiFeedbacks={mappedData.aiFeedbacks as any}
        readonly={true}
        isHintOpen={false}
        isFlagged={false}
      />
    )
  ) : null

  // Render footer
  const canGoPrev = currentQuestionIndex > 0
  const canGoNext = currentQuestionIndex < mappedData.questions.length - 1

  const footerContent = (
    <div className="max-w-7xl mx-auto flex items-center justify-between w-full h-14 px-4 sm:px-6 lg:px-8">
      <button 
        onClick={() => canGoPrev && setCurrentQuestionIndex(prev => prev - 1)}
        disabled={!canGoPrev}
        className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all ${
          canGoPrev 
            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700' 
            : 'bg-slate-50 text-slate-300 dark:bg-slate-900/50 dark:text-slate-700 cursor-not-allowed'
        }`}
        aria-label="Câu trước"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="hidden sm:flex items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-400">Câu hỏi</span>
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
            <span className="text-base font-bold text-slate-800 dark:text-white">{currentQuestionIndex + 1}</span>
            <span className="text-slate-400">/</span>
            <span className="text-sm font-bold text-slate-500">{mappedData.questions.length}</span>
          </div>
        </div>
      </div>

      <button 
        onClick={() => canGoNext && setCurrentQuestionIndex(prev => prev + 1)}
        disabled={!canGoNext}
        className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all ${
          canGoNext 
            ? 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20' 
            : 'bg-slate-50 text-slate-300 dark:bg-slate-900/50 dark:text-slate-700 cursor-not-allowed'
        }`}
        aria-label="Câu tiếp"
      >
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  )

  return (
    <ExamWorkspaceLayout
      sidebarTopContent={headerContent}
      sidebarGrid={
        <QuestionMapSidebar 
          questions={mappedData.mapItems}
          mode="result"
          onSelectQuestion={(id) => {
            const idx = mappedData.questions.findIndex(q => q.id === id)
            if (idx !== -1) {
              setCurrentQuestionIndex(idx)
            }
          }}
        />
      }
      mainContent={
        <div className="flex flex-col h-full overflow-hidden">
          {resultData.overallReasoningRemark && (
            <div className="shrink-0 p-4 pb-0 md:p-8 md:pb-0">
               <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg flex items-start gap-4">
                <div className="bg-white/20 p-3 rounded-xl shrink-0">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Đánh giá tư duy (Dành riêng cho VIP)</h3>
                  <p className="text-white/90 leading-relaxed text-sm">
                    {resultData.overallReasoningRemark}
                  </p>
                </div>
              </div>
            </div>
          )}
          {mainContent}
        </div>
      }
      footerContent={footerContent}
    />
  )
}

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Sparkles, ArrowLeft, Loader2, Award } from 'lucide-react'
import ExamProgressNav from '@/components/exam/taking/ExamProgressNav'
import QuestionMapSidebar, { QuestionMapItem, QuestionStatus } from '@/components/exam/taking/QuestionMapSidebar'
import MultipleChoiceQuestion from '@/components/exam/taking/MultipleChoiceQuestion'
import EssayQuestion from '@/components/exam/taking/EssayQuestion'
import AIHintPanel from '@/components/exam/taking/AIHintPanel'
import { getExamResultById } from '@/lib/api'
import { useToast } from '@/components/ui/ToastProvider'

export default function ExamResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const router = useRouter()
  const toast = useToast()
  
  const [resultData, setResultData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isAiHintOpen, setIsAiHintOpen] = useState(false)
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({})

  const toggleAiHint = () => {
    setIsAiHintOpen(!isAiHintOpen)
  }

  const handleToggleFlag = (qId: string) => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }))
  }

  useEffect(() => {
    let isMounted = true
    const fetchResult = async () => {
      try {
        const data = await getExamResultById(id)
        if (!isMounted) return
        if (data && data.submission) {
          setResultData(data)
        } else {
          toast.error("Không tìm thấy kết quả bài thi")
        }
      } catch (err) {
        if (!isMounted) return
        console.error("Error fetching exam result:", err)
        toast.error("Lỗi khi tải kết quả bài thi")
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchResult()
    return () => {
      isMounted = false
    }
  }, [id])

  // Memoize mapped questions and status
  const mappedData = useMemo(() => {
    if (!resultData || !resultData.submission || !resultData.questions) {
      return { questions: [], mapItems: [], answers: {}, explanations: {}, aiFeedbacks: {}, submission: null, exam: null, totalMaxScore: 0 }
    }

    const sub = resultData.submission
    const exam = resultData.exam || null
    const rawQs = resultData.questions || []

    let parsedAnswers: Record<string, any> = {}
    if (sub.answersJson) {
      try {
        parsedAnswers = typeof sub.answersJson === 'string' ? JSON.parse(sub.answersJson) : sub.answersJson
      } catch (e) {
        console.error("Failed to parse answersJson", e)
      }
    }

    const parentQs = rawQs.filter((q: any) => !q.parentId)
    const childQs = rawQs.filter((q: any) => !!q.parentId)

    const questions: any[] = []
    const mapItems: QuestionMapItem[] = []
    const answers: Record<string, string> = {}
    const explanations: Record<string, string> = {}
    const aiFeedbacks: Record<string, any> = {}

    const structuredQuestions = parentQs.length > 0 ? parentQs : rawQs
    let calculatedMaxScore = 0

    structuredQuestions.forEach((q: any, idx: number) => {
      const subs = childQs.filter((cq: any) => cq.parentId === q.id)
      const isGroup = q.typeQuestion === 'group' || subs.length > 0

      let parsedOptions: any[] = []
      try {
        parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options || '[]') : (q.options || [])
      } catch (e) {}

      const mappedSubs = subs.map((sq: any) => {
        let subOpts: any[] = []
        try {
          subOpts = typeof sq.options === 'string' ? JSON.parse(sq.options || '[]') : (sq.options || [])
        } catch (e) {}

        const ansData = parsedAnswers[sq.id] || {}
        answers[sq.id] = ansData.student_answer || ansData.studentAnswer || ''
        explanations[sq.id] = ansData.student_explanation || ansData.studentExplanation || ''
        
        const subMax = sq.difficultyPoint || 10
        calculatedMaxScore += subMax

        aiFeedbacks[sq.id] = {
          detailId: sq.id,
          isCorrect: ansData.is_correct ?? (ansData.score > 0),
          score: ansData.score || 0,
          maxScore: subMax,
          aiExplanation: ansData.ai_explanation || ansData.aiExplanation || '',
          errorLocation: ansData.error_location || ansData.errorLocation,
          isAppealed: ansData.appeal?.is_appealed || false,
          appealStatus: ansData.appeal?.status || '',
          teacherFeedback: ansData.appeal?.teacher_feedback || '',
          aiReasoningRemark: ansData.ai_reasoning_remark,
          reasoningScore: ansData.reasoning_score
        }

        return {
          ...sq,
          id: sq.id,
          type: sq.type === 'Tự luận' ? 'essay' : 'mc',
          content: sq.content,
          options: subOpts.map((opt: string, i: number) => ({ id: opt, label: String.fromCharCode(65 + i), text: opt })),
          correctAnswer: sq.correctAnswer,
          difficultyPoint: subMax
        }
      })

      const ansData = parsedAnswers[q.id] || {}
      answers[q.id] = ansData.student_answer || ansData.studentAnswer || ''
      explanations[q.id] = ansData.student_explanation || ansData.studentExplanation || ''
      
      const qMax = q.difficultyPoint || 10
      if (!isGroup || mappedSubs.length === 0) {
        calculatedMaxScore += qMax
      }

      aiFeedbacks[q.id] = {
        detailId: q.id,
        isCorrect: ansData.is_correct ?? (ansData.score > 0),
        score: ansData.score || 0,
        maxScore: qMax,
        aiExplanation: ansData.ai_explanation || ansData.aiExplanation || '',
        errorLocation: ansData.error_location || ansData.errorLocation,
        isAppealed: ansData.appeal?.is_appealed || false,
        appealStatus: ansData.appeal?.status || '',
        teacherFeedback: ansData.appeal?.teacher_feedback || '',
        aiReasoningRemark: ansData.ai_reasoning_remark,
        reasoningScore: ansData.reasoning_score
      }

      const isMC = q.type !== 'Tự luận' && !isGroup

      const mappedQ: any = {
        ...q,
        id: q.id,
        type: isMC ? 'Trắc nghiệm' : 'Tự luận',
        type_question: isGroup ? 'group' : 'single',
        content: q.content || `Câu ${idx + 1}`,
        topic: q.topic,
        options: parsedOptions,
        correctAnswer: q.correctAnswer,
        subQuestions: mappedSubs,
        difficultyPoint: qMax
      }

      questions.push(mappedQ)

      // Determine Status for Map
      let status: QuestionStatus = 'warning'
      if (isGroup && mappedSubs.length > 0) {
        const anyCorrect = mappedSubs.some((s: any) => aiFeedbacks[s.id]?.isCorrect)
        const allCorrect = mappedSubs.every((s: any) => aiFeedbacks[s.id]?.isCorrect)
        if (allCorrect) status = 'correct'
        else if (anyCorrect) status = 'warning'
        else status = 'incorrect'
      } else if (isMC) {
        status = ansData.is_correct ? 'correct' : 'incorrect'
      } else {
        if (ansData.score === 0) status = 'incorrect'
        else if (ansData.score >= qMax) status = 'correct'
        else status = 'warning'
      }

      if (idx === currentQuestionIndex) {
        status = 'current'
      }

      mapItems.push({
        id: q.id,
        index: idx,
        status: status,
        isFlagged: !!flaggedQuestions[q.id]
      })
    })

    return { 
      questions, 
      mapItems, 
      answers, 
      explanations, 
      aiFeedbacks, 
      submission: sub, 
      exam, 
      totalMaxScore: calculatedMaxScore > 0 ? calculatedMaxScore : (questions.length * 10) 
    }
  }, [resultData, currentQuestionIndex, flaggedQuestions])

  const handleBack = () => {
    const exam = mappedData.exam
    if (exam) {
      if (exam.cate === 'practice' && exam.lectureId) {
        router.push(`/lectures/lop/${exam.grade || 8}/${exam.lectureId}`)
        return
      } else if (exam.cate === 'exam' && exam.grade) {
        router.push(`/exams/lop/${exam.grade}`)
        return
      } else if (exam.grade) {
        router.push(`/practices/lop/${exam.grade}`)
        return
      }
    }
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Đang tải kết quả bài làm...</h2>
        <p className="text-slate-500">Vui lòng chờ trong giây lát.</p>
      </div>
    )
  }

  if (!resultData || mappedData.questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-6 text-center">
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4">Không tìm thấy kết quả bài thi.</h2>
        <button 
          onClick={handleBack}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>
      </div>
    )
  }

  // Check if still pending/grading
  const isPending = resultData.submission?.status === 'pending' || (resultData.submission?.status !== 'graded' && resultData.submission?.status !== 'COMPLETED')
  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-100 dark:border-slate-700 text-center relative overflow-hidden">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/25 animate-bounce">
            <Sparkles className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3 leading-snug">
            Bài làm của bạn đang được chấm điểm, xin vui lòng chờ...
          </h2>
          
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8">
            Bài thi đang được chấm, vui lòng kiểm tra tin nhắn và quay lại sau.
          </p>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleBack}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = mappedData.questions[currentQuestionIndex]
  const examTitle = mappedData.exam?.title || "Kết quả bài làm"
  const examGrade = mappedData.exam?.grade || mappedData.questions?.[0]?.grade || "8"
  const examType = mappedData.exam?.cate || 'exam'
  
  const totalAchieved = mappedData.submission?.totalScore ?? 0
  const totalMaxScore = mappedData.totalMaxScore
  const standardScore = totalMaxScore > 0 ? (totalAchieved / totalMaxScore) * 10 : 0

  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden bg-background-light dark:bg-background-dark">
      {/* Top Navbar */}
      <ExamProgressNav 
        title={examTitle}
        subject={`Toán Lớp ${examGrade}`}
        completedQuestions={mappedData.questions.length} 
        totalQuestions={mappedData.questions.length} 
        timeLeft={`Điểm tư duy: ${standardScore.toFixed(1)}/10`}
        examType="result"
        onBack={handleBack}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative pb-[88px] w-full">
        {/* Left Navigation Overlay */}
        {currentQuestionIndex > 0 && (
          <button 
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            className="absolute left-0 top-0 bottom-[88px] w-12 md:w-24 z-10 flex items-center justify-start pl-2 md:pl-4 opacity-0 hover:opacity-100 hover:bg-gradient-to-r hover:from-slate-200/50 hover:to-transparent transition-all group"
            aria-label="Câu trước"
          >
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
              <ChevronLeft size={24} />
            </div>
          </button>
        )}

        {/* Right Navigation Overlay */}
        {currentQuestionIndex < mappedData.questions.length - 1 && (
          <button 
            onClick={() => setCurrentQuestionIndex(prev => Math.min(mappedData.questions.length - 1, prev + 1))}
            className="absolute right-0 top-0 bottom-[88px] w-12 md:w-24 z-10 flex items-center justify-end pr-2 md:pr-4 opacity-0 hover:opacity-100 hover:bg-gradient-to-l hover:from-slate-200/50 hover:to-transparent transition-all group"
            aria-label="Câu tiếp theo"
          >
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
              <ChevronRight size={24} />
            </div>
          </button>
        )}

        {/* Central Question Content */}
        {currentQuestion && (
          currentQuestion.type_question === 'single' && currentQuestion.type === 'Trắc nghiệm' ? (
            <MultipleChoiceQuestion 
              resultId={id}
              questionId={currentQuestion.id as any}
              index={currentQuestionIndex}
              topic={currentQuestion.topic || ""}
              content={currentQuestion.content}
              options={currentQuestion.options.map((opt: any, i: number) => ({
                id: typeof opt === 'string' ? opt : (opt.id || opt.text),
                label: typeof opt === 'string' ? String.fromCharCode(65 + i) : (opt.label || String.fromCharCode(65 + i)),
                text: typeof opt === 'string' ? opt : opt.text
              }))}
              selectedOptionId={mappedData.answers[currentQuestion.id] || null}
              selectedExplanation={mappedData.explanations[currentQuestion.id]}
              correctOptionId={currentQuestion.correctAnswer}
              aiExplanation={mappedData.aiFeedbacks[currentQuestion.id]?.aiExplanation}
              aiFeedback={mappedData.aiFeedbacks[currentQuestion.id]}
              readonly={true}
              isHintOpen={isAiHintOpen}
              isFlagged={!!flaggedQuestions[currentQuestion.id]}
              onToggleHint={toggleAiHint}
              onToggleFlag={() => handleToggleFlag(currentQuestion.id)}
              examType={examType}
            />
          ) : (
            <EssayQuestion 
              resultId={id}
              questionId={currentQuestion.id as any}
              index={currentQuestionIndex}
              content={currentQuestion.content}
              sharedContext={currentQuestion.content}
              subQuestions={currentQuestion.subQuestions?.map((sq: any) => ({
                id: sq.id as any,
                type: sq.type === 'Trắc nghiệm' ? 'mc' : 'essay',
                content: sq.content,
                options: sq.options
              })) || []}
              answers={mappedData.answers as any}
              explanations={mappedData.explanations as any}
              aiFeedbacks={mappedData.aiFeedbacks as any}
              readonly={true}
              isHintOpen={isAiHintOpen}
              isFlagged={!!flaggedQuestions[currentQuestion.id]}
              onToggleHint={() => toggleAiHint()}
              onToggleFlag={() => handleToggleFlag(currentQuestion.id)}
              examType={examType}
            />
          )
        )}

        {/* AI Hint Panel */}
        <AIHintPanel 
          isOpen={isAiHintOpen} 
          onClose={() => setIsAiHintOpen(false)} 
          question={resultData?.questions?.find((q: any) => q.id === currentQuestion?.id) || null}
          unlockedLevel={10}
          onUnlock={async () => true}
          readonlyMode={true}
        />

        {/* Question Map Sidebar */}
        <QuestionMapSidebar 
          questions={mappedData.mapItems}
          mode="result"
          onSelectQuestion={(qId) => {
            const idx = mappedData.questions.findIndex(q => q.id === qId)
            if (idx !== -1) {
              setCurrentQuestionIndex(idx)
            }
          }}
        />
      </div>

      {/* Result Footer matching Take Footer layout */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-6 z-[100] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-5 py-3 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Câu trước
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(mappedData.questions.length - 1, prev + 1))}
              disabled={currentQuestionIndex >= mappedData.questions.length - 1}
              className="flex items-center gap-2 px-5 py-3 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Câu tiếp theo
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-base border border-blue-100 dark:border-blue-900/30 shadow-sm">
              <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Điểm tư duy: {standardScore.toFixed(1)}/10</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Sparkles, ArrowLeft, Loader2, Award, Save, CheckCircle } from 'lucide-react'
import ExamProgressNav from '@/components/exam/taking/ExamProgressNav'
import QuestionMapSidebar, { QuestionMapItem, QuestionStatus } from '@/components/exam/taking/QuestionMapSidebar'
import MultipleChoiceQuestion from '@/components/exam/taking/MultipleChoiceQuestion'
import EssayQuestion from '@/components/exam/taking/EssayQuestion'
import AIHintPanel from '@/components/exam/taking/AIHintPanel'
import MathText from '@/components/ui/MathText'
import { getExamResultById, submitTeacherGradingReview } from '@/lib/api'
import { useToast } from '@/components/ui/ToastProvider'

export default function ExamResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isTeacherMode = searchParams.get('mode') === 'grade'
  const toast = useToast()
  
  const [resultData, setResultData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isAiHintOpen, setIsAiHintOpen] = useState(false)
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({})
  const [isVip, setIsVip] = useState(false)

  // Teacher Grading Mode States
  const [teacherScores, setTeacherScores] = useState<Record<string, number>>({})
  const [teacherFeedbacks, setTeacherFeedbacks] = useState<Record<string, string>>({})
  const [overallEssayFeedback, setOverallEssayFeedback] = useState('')
  const [overallComprehensionFeedback, setOverallComprehensionFeedback] = useState('')
  const [summaryTab, setSummaryTab] = useState<'essay' | 'comprehension'>('essay')
  const [teacherGeneralFeedback, setTeacherGeneralFeedback] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr)
          if (
            user.role === 'vip' || 
            user.role === 'admin' || 
            user.role === 'teacher' || 
            user.isVip || 
            user.plan === 'vip' || 
            user.subscriptionPlan === 'vip'
          ) {
            setIsVip(true)
          }
        }
      } catch (e) {
        console.error("Failed to parse user for VIP check", e)
      }
    }
  }, [])

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
          if (data.submission.answersJson) {
            try {
              const parsed = typeof data.submission.answersJson === 'string'
                ? JSON.parse(data.submission.answersJson)
                : data.submission.answersJson
              const scores: Record<string, number> = {}
              const feedbacks: Record<string, string> = {}
              Object.keys(parsed).forEach(k => {
                scores[k] = parsed[k].score || 0
                feedbacks[k] = parsed[k].deduction_reason || parsed[k].deductionReason || parsed[k].ai_explanation || ''
              })
              setTeacherScores(scores)
              setTeacherFeedbacks(feedbacks)
            } catch (e) {}
          }
          const sub = data.submission as any
          setOverallEssayFeedback(sub.overallEssayFeedback || sub.overall_essay_feedback || '')
          setOverallComprehensionFeedback(sub.overallComprehensionFeedback || sub.overall_comprehension_feedback || '')
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

    let structuredQuestions = parentQs.length > 0 ? parentQs : rawQs
    if (exam && Array.isArray(exam.questionIds) && exam.questionIds.length > 0) {
      const qMap = new Map(structuredQuestions.map((q: any) => [q.id, q]))
      const sorted = exam.questionIds.map((qid: string) => qMap.get(qid)).filter(Boolean)
      if (sorted.length > 0) {
        structuredQuestions = sorted
      }
    }

    const questions: any[] = []
    const mapItems: QuestionMapItem[] = []
    const answers: Record<string, string> = {}
    const explanations: Record<string, string> = {}
    const aiFeedbacks: Record<string, any> = {}

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
          deductionReason: ansData.deduction_reason || ansData.deductionReason,
          comprehensionLevel: ansData.comprehension_level || ansData.comprehensionLevel,
          isRandomGuess: ansData.is_random_guess ?? ansData.isRandomGuess ?? false,
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
          solution_guide: sq.solutionGuide || sq.solution_guide,
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
        deductionReason: ansData.deduction_reason || ansData.deductionReason,
        comprehensionLevel: ansData.comprehension_level || ansData.comprehensionLevel,
        isRandomGuess: ansData.is_random_guess ?? ansData.isRandomGuess ?? false,
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
        solution_guide: q.solutionGuide || q.solution_guide,
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

  // Calculate average reasoning score for VIP
  const reasoningScores: number[] = []
  Object.values(mappedData.aiFeedbacks).forEach((fb: any) => {
    if (typeof fb?.reasoningScore === 'number' && fb.reasoningScore > 0) {
      reasoningScores.push(fb.reasoningScore)
    }
  })
  const avgReasoningScore = reasoningScores.length > 0 
    ? (reasoningScores.reduce((a, b) => a + b, 0) / reasoningScores.length)
    : standardScore

  let lectureUrl = undefined
  if (mappedData.exam?.lectureId) {
    const gradeStr = mappedData.exam?.grade || '12'
    const returnUrl = encodeURIComponent(`/exam/${id}/result`)
    lectureUrl = `/lectures/lop/${gradeStr}/${mappedData.exam.lectureId}?returnUrl=${returnUrl}&examId=${id}`
  }

  const handleTeacherCompleteGrading = async () => {
    setIsSubmittingReview(true)
    try {
      const sub = resultData?.submission
      let parsedAnswers: Record<string, any> = {}
      if (sub?.answersJson) {
        parsedAnswers = typeof sub.answersJson === 'string' ? JSON.parse(sub.answersJson) : sub.answersJson
      }

      let calculatedTotal = 0
      Object.keys(parsedAnswers).forEach(qID => {
        const ans = parsedAnswers[qID]
        if (teacherScores[qID] !== undefined) {
          ans.score = teacherScores[qID]
          ans.is_correct = teacherScores[qID] > 0
        }
        if (teacherFeedbacks[qID] !== undefined) {
          ans.deduction_reason = teacherFeedbacks[qID]
        }
        calculatedTotal += (ans.score || 0)
      })

      const payload = {
        answers: parsedAnswers,
        totalScore: calculatedTotal,
        overallEssayFeedback: overallEssayFeedback,
        overallComprehensionFeedback: overallComprehensionFeedback,
        teacherFeedback: teacherGeneralFeedback || "Đã hoàn tất chấm điểm bởi giáo viên"
      }

      await submitTeacherGradingReview(id, payload)
      toast.success("Đã hoàn tất chấm điểm thủ công!")
      router.push('/dashboard/appeals')
    } catch (e) {
      toast.error("Lỗi khi lưu kết quả chấm điểm")
    } finally {
      setIsSubmittingReview(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden bg-background-light dark:bg-background-dark">
      {/* Teacher Mode Top Banner */}
      {isTeacherMode && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 flex items-center justify-between shadow-md z-[110]">
          <div className="flex items-center gap-3 font-bold text-sm md:text-base">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <span>Chế độ Chấm điểm của Giáo viên — Đang duyệt chấm bài thi</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-semibold">
              Mã nộp bài: {id}
            </span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <ExamProgressNav 
        title={examTitle}
        subject={`Toán Lớp ${examGrade}`}
        completedQuestions={mappedData.questions.length} 
        totalQuestions={mappedData.questions.length} 
        timeLeft={`Tổng điểm: ${standardScore.toFixed(1)}/10`}
        examType="result"
        onBack={handleBack}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative pb-[88px] w-full">
        <div className="flex-1 flex overflow-hidden relative w-full">
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
          <div className="flex-1 overflow-y-auto">
            {/* AI Executive Summary Banner - Always Visible */}
            <div className="max-w-4xl mx-auto mt-6 mb-2 px-4 sm:px-6">
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-xl border border-indigo-500/30 overflow-hidden relative">
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-indigo-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/30">
                        <Sparkles className="w-5 h-5 text-white animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                          Báo cáo Đánh giá AI Tổng quan
                          <span className="text-[10px] uppercase font-extrabold bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 px-2 py-0.5 rounded-full">
                            Gemini 3.6 Flash
                          </span>
                        </h3>
                        <p className="text-xs text-indigo-200/80">Tổng hợp nhận xét trình bày & phân tích tư duy toán học</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-indigo-950/80 p-1 rounded-xl border border-indigo-500/30">
                      <button
                        type="button"
                        onClick={() => setSummaryTab('essay')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          summaryTab === 'essay' 
                            ? 'bg-indigo-600 text-white shadow-sm' 
                            : 'text-indigo-200 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        📝 Nhận xét Tự luận
                      </button>
                      <button
                        type="button"
                        onClick={() => setSummaryTab('comprehension')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          summaryTab === 'comprehension' 
                            ? 'bg-purple-600 text-white shadow-sm' 
                            : 'text-purple-200 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        🧠 Phân tích Tư duy
                      </button>
                    </div>
                  </div>

                  <div className="text-sm leading-relaxed text-indigo-100/90 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                    {summaryTab === 'essay' ? (
                      isTeacherMode ? (
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-indigo-300">Giáo viên chỉnh sửa Nhận xét Tự luận:</label>
                          <textarea
                            rows={3}
                            value={overallEssayFeedback}
                            onChange={(e) => setOverallEssayFeedback(e.target.value)}
                            placeholder="Nhập nhận xét tổng quan trình bày tự luận..."
                            className="w-full p-3 rounded-xl bg-slate-900/90 border border-indigo-500/40 text-white text-xs focus:ring-2 focus:ring-indigo-400 outline-none"
                          />
                        </div>
                      ) : (
                        overallEssayFeedback ? (
                          <MathText content={overallEssayFeedback} />
                        ) : (
                          <div className="p-3 bg-indigo-950/50 rounded-xl border border-indigo-500/20 text-xs text-indigo-200">
                            ✨ Bài thi đã được AI chấm tự động và đánh giá dựa trên tiêu chuẩn đáp án chuẩn. Xem chi tiết nhận xét từng câu bên dưới.
                          </div>
                        )
                      )
                    ) : (
                      isTeacherMode ? (
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-purple-300">Giáo viên chỉnh sửa Đánh giá Tư duy:</label>
                          <textarea
                            rows={3}
                            value={overallComprehensionFeedback}
                            onChange={(e) => setOverallComprehensionFeedback(e.target.value)}
                            placeholder="Nhập đánh giá tổng quan tư duy toán học..."
                            className="w-full p-3 rounded-xl bg-slate-900/90 border border-purple-500/40 text-white text-xs focus:ring-2 focus:ring-purple-400 outline-none"
                          />
                        </div>
                      ) : (
                        overallComprehensionFeedback ? (
                          <MathText content={overallComprehensionFeedback} />
                        ) : (
                          <div className="p-3 bg-purple-950/50 rounded-xl border border-purple-500/20 text-xs text-purple-200">
                            🧠 AI phân tích mạch suy luận toán học và năng lực giải quyết vấn đề của bài thi. Dưới đây là phân tích chi tiết cho từng câu hỏi.
                          </div>
                        )
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

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
                  aiExplanation={mappedData.aiFeedbacks[currentQuestion.id]?.aiExplanation || currentQuestion.solution_guide}
                  solutionGuide={currentQuestion.solution_guide}
                  aiFeedback={mappedData.aiFeedbacks[currentQuestion.id]}
                  readonly={true}
                  isHintOpen={isAiHintOpen}
                  isFlagged={!!flaggedQuestions[currentQuestion.id]}
                  onToggleHint={toggleAiHint}
                  onToggleFlag={() => handleToggleFlag(currentQuestion.id)}
                  examType={examType}
                  lectureUrl={lectureUrl}
                />
              ) : (
                <EssayQuestion 
                  resultId={id}
                  questionId={currentQuestion.id as any}
                  index={currentQuestionIndex}
                  content={currentQuestion.content}
                  sharedContext={currentQuestion.content}
                  solution_guide={currentQuestion.solution_guide}
                  subQuestions={currentQuestion.subQuestions?.map((sq: any) => ({
                    id: sq.id as any,
                    type: sq.type === 'Trắc nghiệm' ? 'mc' : 'essay',
                    content: sq.content,
                    options: sq.options,
                    solution_guide: sq.solution_guide,
                    correctAnswer: sq.correctAnswer
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
                  lectureUrl={lectureUrl}
                />
              )
            )}

            {/* Inline Teacher Grading Control Box */}
            {isTeacherMode && currentQuestion && (
              <div className="max-w-4xl mx-auto my-6 p-6 bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="font-bold text-indigo-950 dark:text-indigo-200 text-base">Giáo viên chấm điểm câu này:</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Điểm (Tối đa {currentQuestion.difficultyPoint || 10}):</label>
                    <input 
                      type="number"
                      step="0.25"
                      min="0"
                      max={currentQuestion.difficultyPoint || 10}
                      value={teacherScores[currentQuestion.id] ?? (mappedData.aiFeedbacks[currentQuestion.id]?.score || 0)}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setTeacherScores(prev => ({ ...prev, [currentQuestion.id]: val }))
                      }}
                      className="w-24 px-3 py-1.5 border border-indigo-300 dark:border-indigo-700 rounded-xl bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Ghi chú trừ điểm / Lời nhắn cho câu này:</label>
                  <textarea
                    rows={2}
                    value={teacherFeedbacks[currentQuestion.id] ?? ''}
                    onChange={(e) => {
                      const val = e.target.value
                      setTeacherFeedbacks(prev => ({ ...prev, [currentQuestion.id]: val }))
                    }}
                    placeholder="Nhập lý do trừ điểm hoặc ghi chú..."
                    className="w-full px-4 py-2 border border-indigo-200 dark:border-indigo-800 rounded-xl bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

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
            {isTeacherMode ? (
              <button
                onClick={handleTeacherCompleteGrading}
                disabled={isSubmittingReview}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
              >
                {isSubmittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                <span>Lưu & Hoàn tất chấm điểm</span>
              </button>
            ) : isVip ? (
              <div className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 text-purple-700 dark:text-purple-300 rounded-xl font-bold text-base border border-purple-200 dark:border-purple-800/50 shadow-sm">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Điểm tư duy: {avgReasoningScore.toFixed(1)}/10</span>
                <span className="text-[10px] uppercase font-black bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-2 py-0.5 rounded-full shadow-sm ml-1">
                  VIP
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-base border border-blue-100 dark:border-blue-900/30 shadow-sm">
                <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Tổng điểm: {standardScore.toFixed(1)}/10</span>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}

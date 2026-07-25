'use client'

import React, { useState, useEffect } from 'react'
import ExamProgressNav from '@/components/exam/taking/ExamProgressNav'
import QuestionMapSidebar from '@/components/exam/taking/QuestionMapSidebar'
import MultipleChoiceQuestion from '@/components/exam/taking/MultipleChoiceQuestion'
import EssayQuestion from '@/components/exam/taking/EssayQuestion'
import ExamTakeFooter from '@/components/exam/taking/ExamTakeFooter'
import AIHintPanel from '@/components/exam/taking/AIHintPanel'
import { getExamById, getQuestions } from '@/lib/api'
import { deductPoints } from '@/lib/authApi'
import { Question } from '@/types/question'
import { useToast } from '@/components/ui/ToastProvider'
import { useRouter } from 'next/navigation'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

export default function ExamTakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const [exam, setExam] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [userPoints, setUserPoints] = useState(0)

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [explanations, setExplanations] = useState<Record<string, string>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({})
  
  // AI Hint state
  const [isAiHintOpen, setIsAiHintOpen] = useState(false)
  const [activeHintQuestionId, setActiveHintQuestionId] = useState<string | null>(null)
  const [unlockedHints, setUnlockedHints] = useState<Record<string, number>>({})

  // Anti-cheat state
  const [cheatCount, setCheatCount] = useState(0)
  const [showCheatModal, setShowCheatModal] = useState(false)

  const toast = useToast()
  const router = useRouter()

  useEffect(() => {
    // Get user points
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setUserPoints(user.points || 0)
      } catch (e) {}
    }

    // Fetch exam
    const fetchExamData = async () => {
      try {
        const examData = await getExamById(id)
        if (examData) {
          setExam(examData)
          // Fetch questions
          if (examData.questionIds && examData.questionIds.length > 0) {
            const qRes = await getQuestions(1, 1000, { ids: examData.questionIds })
            // Need to sort questions to match the order of questionIds
            const qMap = new Map(qRes.data.map(q => [q.id, q]))
            const sortedQuestions = examData.questionIds
              .map((qid: string) => qMap.get(qid))
              .filter(Boolean) as Question[]
            setQuestions(sortedQuestions)
          }
        }
      } catch (err) {
        console.error("Failed to fetch exam", err)
        toast.error("Lỗi khi tải đề thi")
      } finally {
        setLoading(false)
      }
    }
    fetchExamData()
  }, [id, toast])

  const totalAwayTimeRef = React.useRef(0);
  const leaveStartTimeRef = React.useRef<number | null>(null);
  const checkIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Lắng nghe sự kiện chống gian lận
  useEffect(() => {
    if (!exam) return;

    const enforceCheatPenalty = (count: number, totalTime: number) => {
      // Mức 3: Lần 3 hoặc tổng thời gian > 3 phút (180s)
      if (count >= 3 || totalTime > 180000) {
        if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
        import('@/lib/api').then(mod => mod.sendCheatWarning(id, 3));
        toast.error("Bài làm đã bị thu tự động do vi phạm quy chế. (Đã gửi cảnh báo Zalo cho phụ huynh)", { duration: 5000 });
        
        // Auto submit
        const answersList = Object.entries(answers).map(([qId, ans]) => ({ questionId: qId, studentAnswer: ans as string, isEssay: false })); // Approximate
        import('@/lib/api').then(mod => mod.submitExam(id, answersList).then(() => {
          router.push(`/exam/${id}/result`);
        }));
        return true; // was submitted
      }
      
      // Mức 2: Lần 2 hoặc tổng thời gian > 1 phút (60s)
      if (count === 2 || totalTime > 60000) {
        import('@/lib/api').then(mod => mod.sendCheatWarning(id, 2));
        setShowCheatModal(true);
        return false;
      }
      
      // Mức 1: Lần 1
      if (count === 1) {
        setShowCheatModal(true);
        return false;
      }
      
      return false;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        leaveStartTimeRef.current = Date.now();
        const nextCount = cheatCount + 1;
        setCheatCount(nextCount);
        
        // Bắt đầu interval kiểm tra nếu học sinh không quay lại
        checkIntervalRef.current = setInterval(() => {
          if (leaveStartTimeRef.current) {
            const currentAway = Date.now() - leaveStartTimeRef.current;
            const currentTotal = totalAwayTimeRef.current + currentAway;
            if (currentTotal > 180000) {
              enforceCheatPenalty(nextCount, currentTotal);
            }
          }
        }, 1000);
      } else {
        // Học sinh quay lại
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
        
        if (leaveStartTimeRef.current) {
          const awayDuration = Date.now() - leaveStartTimeRef.current;
          totalAwayTimeRef.current += awayDuration;
          leaveStartTimeRef.current = null;
        }
        
        enforceCheatPenalty(cheatCount, totalAwayTimeRef.current);
      }
    };

    const handlePreventCopy = (e: Event) => {
      e.preventDefault();
      toast.error("Không được phép sao chép nội dung câu hỏi!");
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handlePreventCopy);
    document.addEventListener('copy', handlePreventCopy);

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handlePreventCopy);
      document.removeEventListener('copy', handlePreventCopy);
    };
  }, [exam, id, router, toast, cheatCount, answers]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  }

  if (!exam || questions.length === 0) {
    return <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-500">
      Không tìm thấy dữ liệu đề thi.
    </div>
  }

  const currentQuestion = questions[currentQuestionIndex]

  const handleAnswerSelect = (questionId: string, answer: string, explanation?: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
    if (explanation) {
      setExplanations(prev => ({ ...prev, [questionId]: explanation }))
    }
  }

  const handleToggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => ({ ...prev, [questionId]: !prev[questionId] }))
  }

  const mapQuestions = questions.map((q, idx) => {
    const isAnswered = !!answers[q.id] || (q.type_question === 'group' && q.subQuestions?.some(sub => !!answers[sub.id]))
    const isCurrent = idx === currentQuestionIndex
    let status: 'done' | 'current' | 'unfinished' = 'unfinished'
    if (isCurrent) status = 'current'
    else if (isAnswered) status = 'done'
    
    const isFlagged = !!flaggedQuestions[q.id] || (q.type_question === 'group' && q.subQuestions?.some(sub => !!flaggedQuestions[sub.id]))

    return {
      id: q.id,
      index: idx,
      status,
      isFlagged
    }
  })

  const handleSubmit = async () => {
    try {
      const answersList = Object.entries(answers).map(([qId, ans]) => {
        // find if it's essay by searching in questions
        let isEssay = false
        for (const q of questions) {
          if (q.id === qId) {
            isEssay = q.type === 'Tự luận'
            break
          }
          if (q.subQuestions) {
            for (const sub of q.subQuestions) {
              if (sub.id === qId) {
                isEssay = sub.type === 'Tự luận'
                break
              }
            }
          }
        }
        
        return {
          questionId: qId,
          studentAnswer: ans,
          isEssay: isEssay
        }
      })

      const res = await import('@/lib/api').then(mod => mod.submitExam(id, answersList))
      if (res && res.status === 'success') {
        toast.success("Nộp bài thành công! AI đang chấm điểm...")
        router.push(`/student`)
      } else {
        toast.error("Nộp bài thất bại")
      }
    } catch (e) {
      console.error(e)
      toast.error("Lỗi khi nộp bài")
    }
  }

  const handleBack = () => {
    if (exam.type === 'practice' && exam.lectureId) {
      router.push(`/lectures/lop/${exam.grade}/${exam.lectureId}`)
    } else {
      router.push(`/student`)
    }
  }

  // Timer logic for 'test'
  // Currently mocked. In a real app we would use setInterval.
  const timeLeftStr = "45:00"

  const toggleAiHint = (questionId: string) => {
    if (exam.type === 'test') {
      toast.error("Gợi ý AI không khả dụng trong chế độ làm bài thi")
      return
    }
    
    if (activeHintQuestionId === questionId && isAiHintOpen) {
      setIsAiHintOpen(false)
      setActiveHintQuestionId(null)
    } else {
      setActiveHintQuestionId(questionId)
      setIsAiHintOpen(true)
    }
  }

  const handleUnlockHint = async (questionId: string, cost: number) => {
    if (userPoints < cost) {
      toast.error("Không đủ điểm")
      return false
    }

    try {
      const res = await deductPoints(cost)
      if (res && res.points !== undefined) {
        setUserPoints(res.points)
        const currentLevel = unlockedHints[questionId] || 0
        setUnlockedHints(prev => ({ ...prev, [questionId]: currentLevel + 1 }))
        return true
      }
      return false
    } catch (e: any) {
      const errMessage = e.response?.data?.error || "Lỗi khi trừ điểm"
      toast.error(errMessage)
      return false
    }
  }

  const activeQuestionData = activeHintQuestionId ? (
    currentQuestion.id === activeHintQuestionId ? currentQuestion : 
    (currentQuestion.subQuestions?.find(sq => sq.id === activeHintQuestionId) || currentQuestion)
  ) : currentQuestion

  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden bg-background-light dark:bg-background-dark">
      <ExamProgressNav 
        title={exam.title}
        subject={`Toán Lớp ${exam.grade || 12}`}
        completedQuestions={Object.keys(answers).length} 
        totalQuestions={questions.length} 
        timeLeft={timeLeftStr}
        examType={exam.type}
        points={userPoints}
        onBack={handleBack}
      />

      <div className="flex-1 flex overflow-hidden relative pb-[88px] w-full">
        {currentQuestion.type_question === 'single' && currentQuestion.type === 'Trắc nghiệm' ? (
          <MultipleChoiceQuestion 
            questionId={currentQuestion.id as any}
            index={currentQuestionIndex}
            topic={currentQuestion.topic || ""}
            content={currentQuestion.content}
            options={currentQuestion.options.map((opt, i) => ({ id: String.fromCharCode(65 + i), text: opt }))}
            selectedOptionId={answers[currentQuestion.id] || null}
            selectedExplanation={explanations[currentQuestion.id]}
            isHintOpen={isAiHintOpen && activeHintQuestionId === currentQuestion.id}
            isFlagged={!!flaggedQuestions[currentQuestion.id]}
            onSelectOption={(optId, explanation) => handleAnswerSelect(currentQuestion.id, optId, explanation)}
            onToggleHint={() => toggleAiHint(currentQuestion.id)}
            onToggleFlag={() => handleToggleFlag(currentQuestion.id)}
            examType={exam.type}
          />
        ) : (
          <EssayQuestion 
            questionId={currentQuestion.id as any}
            index={currentQuestionIndex}
            content={currentQuestion.content}
            sharedContext={currentQuestion.content}
            subQuestions={currentQuestion.subQuestions?.map(sq => ({
              id: sq.id as any,
              type: sq.type === 'Trắc nghiệm' ? 'mc' : 'essay',
              content: sq.content,
              options: sq.options ? sq.options.map((opt, i) => ({ id: String.fromCharCode(65 + i), text: opt })) : undefined
            })) as any || []}
            answers={answers}
            explanations={explanations}
            isHintOpen={isAiHintOpen}
            activeHintQuestionId={activeHintQuestionId as any}
            isFlagged={!!flaggedQuestions[currentQuestion.id]}
            onAnswerChange={(id, val, explanation) => handleAnswerSelect(id as any, val, explanation)}
            onToggleHint={(subId) => toggleAiHint(subId as any)}
            onToggleFlag={() => handleToggleFlag(currentQuestion.id)}
            examType={exam.type}
          />
        )}

        <AIHintPanel 
          isOpen={isAiHintOpen} 
          onClose={() => setIsAiHintOpen(false)} 
          question={activeQuestionData}
          unlockedLevel={unlockedHints[activeHintQuestionId || ''] || 0}
          onUnlock={handleUnlockHint}
        />

        <QuestionMapSidebar 
          questions={mapQuestions as any}
          onSelectQuestion={(id) => {
            const idx = questions.findIndex(q => q.id === id)
            if (idx !== -1) {
              setCurrentQuestionIndex(idx)
            }
          }}
          onSubmit={handleSubmit}
        />
      </div>

      <ExamTakeFooter 
        onPrev={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
        onNext={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
        onSubmit={handleSubmit}
        canGoPrev={currentQuestionIndex > 0}
        canGoNext={currentQuestionIndex < questions.length - 1}
        answeredCount={Object.keys(answers).length}
        totalCount={questions.length}
      />

      <ConfirmModal
        isOpen={showCheatModal}
        onClose={() => setShowCheatModal(false)}
        onConfirm={() => setShowCheatModal(false)}
        title={cheatCount === 1 ? "Cảnh báo gian lận (Lần 1)" : "Cảnh báo gian lận nghiêm trọng (Lần 2)"}
        description={
          cheatCount === 1 
            ? "Bạn vừa rời khỏi màn hình làm bài. Vui lòng tập trung! Nếu vi phạm quá 2 lần, hệ thống sẽ tự động thu bài."
            : "Đây là lần vi phạm cuối cùng! Nếu bạn rời khỏi màn hình một lần nữa, hệ thống sẽ tự động thu bài và gửi cảnh báo Zalo cho phụ huynh."
        }
        confirmText="Tôi đã hiểu"
        hideCancel={true}
        isDestructive={cheatCount > 1}
      />
    </div>
  )
}

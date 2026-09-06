import React, { useState } from 'react'
import { Sparkles, CheckCircle2, Flag, BookOpen, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import MathText from '@/components/ui/MathText'
import ExplanationPopup from './ExplanationPopup'
import { useToast } from '@/components/ui/ToastProvider'
import { reportQuestion, submitAppeal } from '@/lib/api'

export interface MultipleChoiceOption {
  id: string
  text: string
}

interface MultipleChoiceQuestionProps {
  resultId?: string
  questionId: number
  index: number
  topic?: string
  content: string
  options: MultipleChoiceOption[]
  selectedOptionId: string | null
  selectedExplanation?: string
  correctOptionId?: string | null
  aiExplanation?: string
  aiFeedback?: { detailId?: string, isCorrect: boolean, aiExplanation: string, score: number, maxScore: number, isAppealed?: boolean, appealStatus?: string, teacherFeedback?: string }
  readonly?: boolean
  isHintOpen: boolean
  isFlagged: boolean
  examType?: string
  lectureUrl?: string
  onSelectOption?: (optionId: string, explanation?: string) => void
  onToggleHint?: () => void
  onToggleFlag?: () => void
}

export default function MultipleChoiceQuestion({
  resultId,
  questionId,
  index,
  content,
  options,
  selectedOptionId,
  selectedExplanation,
  correctOptionId,
  aiExplanation,
  aiFeedback,
  readonly = false,
  isHintOpen,
  isFlagged,
  examType = 'exam',
  lectureUrl,
  onSelectOption,
  onToggleHint,
  onToggleFlag,
}: MultipleChoiceQuestionProps) {
  const [pendingOptionId, setPendingOptionId] = useState<string | null>(null)
  
  const toast = useToast()
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportMessage, setReportMessage] = useState('')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)

  const handleOptionClick = (optionId: string) => {
    // If clicking an already selected option, re-open the popup with existing explanation
    setPendingOptionId(optionId)
  }

  const handleExplanationSubmit = (explanation: string) => {
    if (pendingOptionId && onSelectOption) {
      onSelectOption(pendingOptionId, explanation)
      setPendingOptionId(null)
    }
  }

  const handleExplanationClose = () => {
    setPendingOptionId(null)
  }

  const handleReportSubmit = async () => {
    if (!reportMessage.trim()) return
    setIsSubmittingReport(true)
    try {
      if (readonly && resultId && aiFeedback?.detailId) {
        await submitAppeal(resultId, aiFeedback.detailId, reportMessage)
        toast.success('Kháng cáo đã được gửi thành công!')
      } else {
        await reportQuestion(questionId.toString(), reportMessage)
        toast.success('Báo lỗi câu hỏi thành công!')
      }
      setIsReportModalOpen(false)
      setReportMessage('')
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi gửi yêu cầu')
    } finally {
      setIsSubmittingReport(false)
    }
  }

  return (
    <main className="flex-grow flex flex-row items-start justify-center p-6 sm:p-12 relative w-full">
      <div className={`w-full max-w-4xl space-y-8 transition-all duration-500 ${isHintOpen ? 'mr-[460px]' : ''}`}>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-lg uppercase">
                Câu hỏi {index + 1}
              </span>
              <div className="flex items-center gap-2">
                {examType === 'practice' && lectureUrl && (
                  <Link
                    href={lectureUrl}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-full font-semibold text-sm transition-all active:scale-95"
                    title="Xem bài giảng liên quan"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="hidden sm:inline">Bài giảng</span>
                  </Link>
                )}
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm cursor-pointer transition-all active:scale-95 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400`}
                  title={readonly ? "Kháng cáo/Báo cáo lỗi" : "Câu hỏi lỗi"}
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span className="hidden sm:inline">{readonly ? "Báo cáo/Kháng cáo" : "Câu hỏi lỗi"}</span>
                </button>
                <button
                  onClick={onToggleFlag}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm cursor-pointer transition-all active:scale-95 ${
                    isFlagged 
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                  title="Đánh dấu câu hỏi này để xem lại sau"
                >
                  <Flag className={`w-5 h-5 ${isFlagged ? 'fill-amber-500' : ''}`} />
                  <span className="hidden sm:inline">{isFlagged ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
                </button>
                {examType === 'practice' && !readonly && onToggleHint && (
                  <button 
                    data-hint-toggle="true"
                    onClick={onToggleHint}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full font-semibold text-sm cursor-pointer hover:bg-blue-700 transition-all shadow-md shadow-primary/20 active:scale-95"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Gợi ý từ AI</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="text-2xl font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
              <MathText content={content} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrect = readonly && correctOptionId === option.id;
            const isWrongSelection = readonly && isSelected && correctOptionId !== option.id;

            let optionClass = "bg-white dark:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            let idClass = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-primary group-hover:text-white"

            if (readonly) {
              if (isCorrect) {
                optionClass = "bg-green-50 dark:bg-green-900/10 border-green-500 shadow-green-500/5"
                idClass = "bg-green-500 text-white shadow-sm"
              } else if (isWrongSelection) {
                optionClass = "bg-red-50 dark:bg-red-900/10 border-red-500 shadow-red-500/5"
                idClass = "bg-red-500 text-white shadow-sm"
              } else {
                optionClass = "bg-white dark:bg-slate-900 border-slate-200 opacity-60"
                idClass = "bg-slate-100 dark:bg-slate-800 text-slate-400"
              }
            } else if (isSelected) {
              optionClass = "bg-white dark:bg-slate-900 border-primary shadow-primary/5"
              idClass = "bg-primary text-white shadow-sm"
            }
            
            return (
              <button 
                key={option.id}
                onClick={() => {
                  if (!readonly) handleOptionClick(option.id)
                }}
                disabled={readonly}
                className={`group relative flex items-center gap-6 p-6 rounded-xl border-2 transition-all shadow-sm text-left ${optionClass} ${readonly ? 'cursor-default hover:border-inherit' : ''}`}
              >
                <div className={`w-12 h-12 flex items-center justify-center font-bold rounded-lg transition-colors text-xl ${idClass}`}>
                  {option.id}
                </div>
                <div className="flex-1">
                  <span className="text-xl font-medium text-slate-900 dark:text-white">
                    <MathText content={option.text} />
                  </span>
                </div>
                {isSelected && (
                  <div className="absolute top-4 right-4 text-primary">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
        {readonly && aiExplanation && (
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <h4 className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold mb-3">
              <Sparkles className="w-5 h-5" />
              Giải thích từ AI
            </h4>
            <div className="text-slate-700 dark:text-slate-300">
              <MathText content={aiExplanation} />
            </div>
          </div>
        )}
      </div>
      
      <ExplanationPopup 
        isOpen={pendingOptionId !== null} 
        onClose={handleExplanationClose} 
        onSubmit={handleExplanationSubmit}
        initialExplanation={pendingOptionId === selectedOptionId ? selectedExplanation : ''}
      />

      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              {readonly ? 'Báo lỗi / Kháng cáo' : 'Câu hỏi lỗi'}
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              {readonly ? 'Nêu rõ lý do bạn muốn kháng cáo hoặc lỗi của câu hỏi này.' : 'Vui lòng mô tả lỗi của câu hỏi (sai đề, thiếu đáp án, lỗi chính tả, ...)'}
            </p>
            <textarea
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value)}
              placeholder="Nhập nội dung..."
              className="w-full min-h-[120px] p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-slate-700 dark:text-slate-200"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl font-semibold transition-colors"
                disabled={isSubmittingReport}
              >
                Hủy
              </button>
              <button
                onClick={handleReportSubmit}
                disabled={isSubmittingReport || !reportMessage.trim()}
                className="flex-1 px-4 py-3 bg-primary text-white hover:bg-primary/90 disabled:opacity-50 rounded-xl font-semibold transition-colors shadow-md shadow-primary/20 flex items-center justify-center"
              >
                {isSubmittingReport ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Gửi'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

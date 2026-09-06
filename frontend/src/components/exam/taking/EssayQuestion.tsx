import React from 'react'
import { Camera, CheckCircle, Sparkles, Flag, BookOpen, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import MathText from '@/components/ui/MathText'
import RichTextEditor from '@/components/questions/creator/editor/RichTextEditor'
import { useToast } from '@/components/ui/ToastProvider'
import { recognizeHandwriting, submitAppeal, reportQuestion } from '@/lib/api'
import { useState } from 'react'

export interface SubQuestion {
  id: number
  type: 'mc' | 'essay'
  content: React.ReactNode
  options?: { id: string, text: string }[]
}

interface EssayQuestionProps {
  resultId?: string
  questionId: number
  index: number
  content?: string
  sharedContext?: React.ReactNode
  subQuestions?: SubQuestion[]
  answers: Record<number, string>
  explanations?: Record<number, string>
  isHintOpen: boolean
  activeHintQuestionId?: number
  isFlagged: boolean
  examType?: string
  readonly?: boolean
  lectureUrl?: string
  aiFeedbacks?: Record<number, { 
    detailId?: string, 
    isCorrect: boolean, 
    aiExplanation: string, 
    errorLocation?: any, 
    score: number, 
    maxScore: number,
    isAppealed?: boolean,
    appealStatus?: string,
    teacherFeedback?: string
  }>
  onAnswerChange?: (id: number, answer: string, explanation?: string) => void
  onToggleHint?: (id?: number) => void
  onToggleFlag?: () => void
}

function EditorItem({ 
  q, 
  answer, 
  explanation, 
  onAnswerChange, 
  isGroup,
  examType,
  readonly,
  aiFeedback,
  onToggleHint,
  resultId
}: { 
  q: { id: number, label: string, type: string },
  answer: string,
  explanation: string,
  onAnswerChange: (id: number, answer: string, explanation?: string) => void,
  isGroup: boolean,
  examType?: string,
  readonly?: boolean,
  aiFeedback?: { detailId?: string, isCorrect: boolean, aiExplanation: string, score: number, maxScore: number, isAppealed?: boolean, appealStatus?: string, teacherFeedback?: string },
  onToggleHint?: (id: number) => void
  resultId?: string
}) {
  const isMC = q.type === 'mc'
  const editorContent = isMC ? explanation : answer
  
  const { success, error } = useToast()
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false)
  const [appealMessage, setAppealMessage] = useState('')
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false)

  const handleEditorChange = (val: string) => {
    if (onAnswerChange) {
      if (isMC) {
        onAnswerChange(q.id, answer, val)
      } else {
        onAnswerChange(q.id, val)
      }
    }
  }

  const [isOcrProcessing, setIsOcrProcessing] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const toast = useToast()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setIsOcrProcessing(true)
      const text = await recognizeHandwriting(file)
      handleEditorChange(editorContent + (editorContent ? '\n' : '') + text)
      toast.success('Nhận dạng thành công')
    } catch (error) {
      console.error('OCR failed', error)
      toast.error('Lỗi khi nhận dạng chữ viết tay')
    } finally {
      setIsOcrProcessing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-[400px]">
      <div className="flex items-center justify-between mb-4">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          {isMC ? `Giải thích ${q.label}` : `Lời giải ${q.label}`}
        </label>
        <div className="flex space-x-2">
          {examType === 'practice' && !readonly && onToggleHint && (
            <button 
              data-hint-toggle="true"
              onClick={() => onToggleHint(q.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-semibold text-xs cursor-pointer transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gợi ý</span>
            </button>
          )}
          {editorContent.trim().length > 0 && (
            <span className="flex items-center text-xs text-green-600 dark:text-green-400 font-medium">
              <CheckCircle className="w-4 h-4 mr-1" />
              Đã lưu tự động
            </span>
          )}
        </div>
      </div>

      {/* Editor Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
        <RichTextEditor
          content={editorContent}
          onChange={handleEditorChange}
          placeholder={isMC ? "Nhập giải thích cho đáp án bạn chọn..." : (isGroup ? `Nhập lời giải chi tiết cho ${q.label.toLowerCase()}...` : "Nhập lời giải chi tiết tại đây (Sử dụng các công cụ hỗ trợ trên)...")}
          className="flex-1 border-none rounded-none rounded-t-xl"
          minHeight="300px"
          readOnly={readonly}
        />

        {/* Bottom Upload Zone - only show if not readonly */}
        {!readonly && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <input 
              type="file" 
              hidden 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleFileUpload}
            />
            <button 
              type="button" 
              disabled={isOcrProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className={`mb-1 w-6 h-6 ${isOcrProcessing ? 'text-primary animate-pulse' : 'text-slate-400 group-hover:text-primary'}`} />
              <span className={`text-sm font-medium ${isOcrProcessing ? 'text-primary' : 'text-slate-600 dark:text-slate-400 group-hover:text-primary'}`}>
                {isOcrProcessing ? 'Đang nhận dạng chữ viết tay...' : 'Tải ảnh lời giải bài làm tay'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* AI Feedback Box - only show if readonly and feedback exists */}
      {readonly && aiFeedback && (
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-lg">
              <Sparkles className="w-5 h-5" />
              Đánh giá từ AI
            </h4>
            <div className="flex items-center gap-3">
              <span className="font-bold text-xl text-blue-800 dark:text-blue-300">
                {aiFeedback.score} / {aiFeedback.maxScore} <span className="text-sm font-normal">điểm</span>
              </span>
              
              {aiFeedback.isAppealed ? (
                <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                  aiFeedback.appealStatus === 'APPROVED' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                  aiFeedback.appealStatus === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
                  'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
                }`}>
                  {aiFeedback.appealStatus === 'APPROVED' ? 'Đã duyệt' :
                   aiFeedback.appealStatus === 'REJECTED' ? 'Bị từ chối' : 'Đang duyệt kháng cáo'}
                </span>
              ) : (
                <button 
                  className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
                  onClick={() => setIsAppealModalOpen(true)}
                >
                  Kháng cáo
                </button>
              )}
            </div>
          </div>
          <div className="text-slate-700 dark:text-slate-300 prose prose-blue max-w-none">
            <MathText content={aiFeedback.aiExplanation} />
          </div>
          
          {aiFeedback.teacherFeedback && (
            <div className="mt-4 p-4 bg-white/50 dark:bg-slate-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl">
              <p className="text-sm font-semibold text-slate-500 mb-1">Lời nhắn của giáo viên:</p>
              <p className="text-slate-700 dark:text-slate-300 italic">{aiFeedback.teacherFeedback}</p>
            </div>
          )}
        </div>
      )}

      {/* Appeal Modal */}
      {isAppealModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Kháng cáo / Báo cáo lỗi
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              Nêu rõ lý do bạn muốn kháng cáo hoặc lỗi của câu hỏi này.
            </p>
            <textarea
              value={appealMessage}
              onChange={(e) => setAppealMessage(e.target.value)}
              placeholder="Ví dụ: Lời giải của em áp dụng định lý X nhưng AI lại chấm theo cách Y..."
              className="w-full min-h-[120px] p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-slate-700 dark:text-slate-200"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsAppealModalOpen(false)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl font-semibold transition-colors"
                disabled={isSubmittingAppeal}
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  if (!appealMessage.trim()) {
                    error('Vui lòng nhập lý do')
                    return
                  }
                  if (!resultId || !aiFeedback?.detailId) {
                    error('Lỗi dữ liệu. Vui lòng tải lại trang.')
                    return
                  }
                  setIsSubmittingAppeal(true)
                  try {
                    await submitAppeal(resultId, aiFeedback.detailId, appealMessage)
                    success('Kháng cáo đã được gửi thành công!')
                    setIsAppealModalOpen(false)
                    window.location.reload()
                  } catch (e: any) {
                    error(e.response?.data?.error || 'Lỗi khi gửi kháng cáo')
                  } finally {
                    setIsSubmittingAppeal(false)
                  }
                }}
                disabled={isSubmittingAppeal || !appealMessage.trim()}
                className="flex-1 px-4 py-3 bg-primary text-white hover:bg-primary/90 disabled:opacity-50 rounded-xl font-semibold transition-colors shadow-md shadow-primary/20 flex items-center justify-center"
              >
                {isSubmittingAppeal ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Gửi'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function EssayQuestion({
  resultId,
  questionId,
  index,
  content,
  sharedContext,
  subQuestions,
  answers,
  explanations,
  isHintOpen,
  activeHintQuestionId,
  isFlagged,
  examType = 'exam',
  readonly = false,
  lectureUrl,
  aiFeedbacks,
  onAnswerChange,
  onToggleHint,
  onToggleFlag,
}: EssayQuestionProps) {
  
  const isGroup = subQuestions && subQuestions.length > 0;
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportMessage, setReportMessage] = useState('')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const toast = useToast()

  const handleReportSubmit = async () => {
    if (!reportMessage.trim()) return
    setIsSubmittingReport(true)
    try {
      const isGroup = subQuestions && subQuestions.length > 0;
      if (readonly && resultId && !isGroup && aiFeedbacks?.[questionId]?.detailId) {
        await submitAppeal(resultId, aiFeedbacks[questionId].detailId!, reportMessage)
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

  // Determine what to render on the left side
  const renderLeftContent = () => {
    if (isGroup) {
      return (
        <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
          <div className="text-lg leading-relaxed">
            {typeof sharedContext === 'string' ? <MathText content={sharedContext} /> : sharedContext}
          </div>
          <ul className="list-disc ml-5 space-y-2 mt-4 text-lg leading-relaxed">
            {subQuestions.map((q) => (
              <li key={q.id}>
                <MathText content={q.content as string} />
                {q.type === 'mc' && q.options && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {q.options.map((opt) => {
                      const isSelected = answers[q.id] === opt.id;
                      return (
                        <button 
                          key={opt.id}
                          onClick={() => {
                            if (!readonly && onAnswerChange) {
                              onAnswerChange(q.id, opt.id, explanations?.[q.id] || '')
                            }
                          }}
                          disabled={readonly}
                          className={`group relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all shadow-sm text-left
                            ${isSelected 
                              ? 'bg-white dark:bg-slate-900 border-primary shadow-primary/5' 
                              : 'bg-white dark:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                            }
                            ${readonly ? 'cursor-default' : ''}
                          `}
                        >
                          <div className={`w-10 h-10 flex items-center justify-center font-bold rounded-lg transition-colors text-lg
                            ${isSelected
                              ? 'bg-primary text-white shadow-sm'
                              : (readonly ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-primary group-hover:text-white')
                            }
                          `}>
                            {opt.id}
                          </div>
                          <div className="flex-1">
                            <span className="text-lg font-medium text-slate-900 dark:text-white">
                              <MathText content={opt.text} />
                            </span>
                          </div>
                          {isSelected && (
                            <div className="absolute top-3 right-3 text-primary">
                              <CheckCircle className="w-5 h-5" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )
    }

    return (
      <div className="prose prose-slate dark:prose-invert max-w-none mb-8 text-lg leading-relaxed">
        <MathText content={content || ''} />
      </div>
    )
  }

  // Determine what to render on the right side
  const renderEditors = () => {
    const questionsToRender = isGroup 
      ? subQuestions.map((q, i) => ({ id: q.id, label: `Ý ${i + 1}`, type: q.type }))
      : [{ id: questionId, label: 'của bạn', type: 'essay' }];

    return (
      <div className="flex-1 py-8 pr-8 pl-4 flex flex-col max-w-xl mr-auto w-full space-y-8">
        {questionsToRender.map((q, i) => (
          <EditorItem 
            key={q.id}
            q={{id: q.id, label: isGroup ? `Câu ${index + 1}.${i + 1}` : 'của bạn', type: q.type}}
            answer={answers[q.id] || ''}
            explanation={explanations?.[q.id] || ''}
            onAnswerChange={onAnswerChange || (() => {})}
            isGroup={!!isGroup}
            examType={examType}
            readonly={readonly}
            aiFeedback={aiFeedbacks?.[q.id]}
            resultId={resultId}
            onToggleHint={onToggleHint}
          />
        ))}
      </div>
    )
  }

  return (
    <main className={`flex-1 flex overflow-hidden relative transition-all duration-500 ${isHintOpen ? 'mr-[460px]' : ''}`}>
      {/* Left Pane: Problem & Geometry */}
      <div className="w-1/2 overflow-y-auto p-8 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <div className="max-w-xl ml-auto">
          <div className="flex items-center justify-between mb-6">
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
            </div>
          </div>
          
          {renderLeftContent()}
        </div>
      </div>

      {/* Right Pane: Solution Editor */}
      <div className="w-1/2 overflow-y-auto bg-slate-50 dark:bg-slate-950">
        {renderEditors()}
      </div>

      {isReportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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

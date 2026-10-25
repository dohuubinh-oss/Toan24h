import React, { useState } from 'react'
import { Camera, CheckCircle, Sparkles, Flag, BookOpen, AlertTriangle, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import DOMPurify from 'dompurify'
import MathText from '@/components/ui/MathText'
import RichTextEditor from '@/components/questions/creator/editor/RichTextEditor'
import { toast } from '@/components/ui/ToastProvider'
import { recognizeHandwriting, submitAppeal, reportQuestion } from '@/lib/api'
import MobileQrUploadModal from './MobileQrUploadModal'
import InAppCameraModal from './InAppCameraModal'

export interface SubQuestion {
  id: string | number
  type: 'mc' | 'essay'
  diagram_svg?: string | null
  content: React.ReactNode
  options?: { id: string, text: string }[]
  solution_guide?: string
  correctAnswer?: string
}

export interface DiagramResultData {
  has_diagram_required?: boolean
  hasDiagramRequired?: boolean
  score: number
  max_score?: number
  maxScore?: number
  is_correct?: boolean
  isCorrect?: boolean
  explanation?: string
  student_diagram_url?: string
  studentDiagramUrl?: string
}

export interface StepGradeResult {
  step: number
  title: string
  score: number
  max_score: number
  is_correct: boolean
  error_location?: string
  deduction_reason?: string
}

export interface AIFeedbackData {
  detailId?: string
  isCorrect: boolean
  aiExplanation: string
  errorLocation?: any
  deductionReason?: string
  comprehensionLevel?: string
  isRandomGuess?: boolean
  score: number
  maxScore: number
  isAppealed?: boolean
  appealStatus?: string
  teacherFeedback?: string
  aiReasoningRemark?: string
  reasoningScore?: number
  stepResults?: StepGradeResult[]
  isAlternativeMethod?: boolean
  diagramResult?: DiagramResultData
  studentDiagramUrl?: string
}

interface EssayQuestionProps {
  resultId?: string
  questionId: string | number
  index: number
  diagram_svg?: string | null
  diagramSvg?: string | null
  content?: string
  sharedContext?: React.ReactNode
  solution_guide?: string
  subQuestions?: SubQuestion[]
  answers: Record<string | number, string>
  explanations?: Record<string | number, string>
  isHintOpen: boolean
  activeHintQuestionId?: string | number
  isFlagged: boolean
  examType?: string
  readonly?: boolean
  lectureUrl?: string
  aiFeedbacks?: Record<string | number, AIFeedbackData>
  onAnswerChange?: (id: string | number, answer: string, explanation?: string) => void
  onToggleHint?: (id?: string | number) => void
  onToggleFlag?: () => void
}

function HighlightedAnswer({ content, aiFeedback }: { content: string, aiFeedback?: any }) {
  const [tooltip, setTooltip] = useState<{ x: number, y: number, deduction: string, errorLoc: string } | null>(null)

  if (!content) return null
  if (!aiFeedback?.errorLocation && !aiFeedback?.deductionReason) {
    return <MathText content={content} />
  }

  const errorLocStr = aiFeedback.errorLocation ? String(aiFeedback.errorLocation).trim() : ''
  const deduction = aiFeedback.deductionReason || 'Phát hiện lỗi sai ở bước biến đổi này.'

  let renderedContent = <MathText content={content} />

  const cleanAttr = (str: string) => str.replace(/"/g, '&quot;')

  if (errorLocStr) {
    const escapedStr = errorLocStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escapedStr})(?![^<]*>)`, 'i')

    if (regex.test(content)) {
      const highlightedHtml = content.replace(
        regex,
        `<span data-highlight="true" data-deduction="${cleanAttr(deduction)}" data-error-loc="${cleanAttr(errorLocStr)}" class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded border-b-2 border-amber-500 inline-flex items-center gap-1 shadow-xs cursor-pointer hover:bg-amber-300 transition-colors">
          $1
          <span class="text-[10px] text-red-600 font-black">⚠️</span>
        </span>`
      )
      renderedContent = <MathText content={highlightedHtml} />
    }
  }

  const handleMouseOver = (e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest('[data-highlight="true"]') as HTMLElement
    if (target) {
      const rect = target.getBoundingClientRect()
      const ded = target.getAttribute('data-deduction') || deduction
      const errLoc = target.getAttribute('data-error-loc') || errorLocStr
      setTooltip({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
        deduction: ded,
        errorLoc: errLoc
      })
    }
  }

  const handleMouseLeave = () => {
    setTooltip(null)
  }

  return (
    <div 
      className="space-y-3 relative"
      onMouseOver={handleMouseOver}
      onMouseLeave={handleMouseLeave}
    >
      {renderedContent}

      {/* Clean app-styled deduction card */}
      <div className="mt-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs shadow-xs space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Vị trí sai: &quot;{errorLocStr || 'Bước biến đổi trong bài làm'}&quot;</span>
        </div>
        <div className="text-amber-900/90 leading-relaxed border-t border-amber-200/60 pt-1.5 mt-1">
          <strong>📌 Lý do trừ điểm:</strong> {deduction}
        </div>
      </div>

      {/* Viewport-fixed hover tooltip styled matching app design tokens */}
      {tooltip && (
        <div 
          style={{ 
            position: 'fixed', 
            left: `${tooltip.x}px`, 
            top: `${tooltip.y}px`, 
            transform: 'translate(-50%, -100%)' 
          }}
          className="z-[9999] pointer-events-none flex flex-col w-72 p-3.5 bg-white text-slate-800 rounded-2xl shadow-xl shadow-amber-500/10 text-xs border-2 border-amber-300 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="font-bold text-amber-800 flex items-center gap-1.5 mb-1.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Vị trí sai: &quot;{tooltip.errorLoc}&quot;</span>
          </div>
          <div className="text-slate-700 text-xs leading-relaxed border-t border-amber-200/80 pt-1.5 mt-0.5">
            <strong>📌 Lý do trừ điểm:</strong> {tooltip.deduction}
          </div>
          {/* Arrow pointing down matching tooltip background */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
        </div>
      )}
    </div>
  )
}

function EditorItem({ 
  q, 
  answer, 
  explanation, 
  diagramUrl,
  onAnswerChange, 
  isGroup,
  examType,
  readonly,
  aiFeedback,
  onToggleHint,
  resultId
}: { 
  q: { id: number | string, label: string, type: string, solution_guide?: string, correctAnswer?: string },
  answer: string,
  explanation: string,
  diagramUrl?: string,
  onAnswerChange: (id: any, answer: string, explanation?: string) => void,
  isGroup: boolean,
  examType?: string,
  readonly?: boolean,
  aiFeedback?: AIFeedbackData,
  onToggleHint?: (id: any) => void
  resultId?: string
}) {
  const isMC = q.type === 'mc'
  const editorContent = (isMC ? (explanation || answer) : (answer || explanation)) || ''

  const handleEditorChange = (val: string) => {
    if (onAnswerChange) {
      if (isMC) {
        onAnswerChange(q.id, answer, val)
      } else {
        onAnswerChange(q.id, val)
      }
    }
  }

  const [isQrModalOpen, setIsQrModalOpen] = React.useState(false)
  const [isInAppCameraOpen, setIsInAppCameraOpen] = React.useState(false)
  const [qrSessionId, setQrSessionId] = React.useState('')

  const [isDiagramQrModalOpen, setIsDiagramQrModalOpen] = React.useState(false)
  const [diagramQrSessionId, setDiagramQrSessionId] = React.useState('')

  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false
    return (
      window.matchMedia('(pointer: coarse)').matches ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    )
  }

  const handleOpenQrModal = () => {
    const newSession = 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now()
    setQrSessionId(newSession)
    setIsQrModalOpen(true)
  }

  const handleOpenDiagramQrModal = () => {
    const newSession = 'sess_diag_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now()
    setDiagramQrSessionId(newSession)
    setIsDiagramQrModalOpen(true)
  }

  const handleCameraClick = () => {
    if (isMobileDevice()) {
      setIsInAppCameraOpen(true)
    } else {
      handleOpenQrModal()
    }
  }

  const handleQrUploadSuccess = (ocrText: string) => {
    handleEditorChange(editorContent + (editorContent ? '\n' : '') + ocrText)
  }

  return (
    <div className="flex flex-col flex-1 min-h-[250px]">
      {readonly ? (
        <div className="flex flex-col flex-1">
          {/* Dedicated Diagram Result Card */}
          {aiFeedback?.diagramResult && (
            <div className="mb-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h4 className="text-slate-800 font-bold text-base">
                    Phần vẽ hình: {aiFeedback.diagramResult.score ?? 0} / {aiFeedback.diagramResult.maxScore ?? aiFeedback.diagramResult.max_score ?? 0.5} điểm
                  </h4>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    (aiFeedback.diagramResult.isCorrect ?? aiFeedback.diagramResult.is_correct)
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }`}
                >
                  {(aiFeedback.diagramResult.isCorrect ?? aiFeedback.diagramResult.is_correct) ? '✓ Vẽ đúng hình (+0.5đ)' : '✗ Chưa chính xác (0.0đ)'}
                </span>
              </div>

              {aiFeedback.diagramResult.explanation && (
                <p className="text-slate-700 text-sm mb-3">
                  {aiFeedback.diagramResult.explanation}
                </p>
              )}

              {(aiFeedback.diagramResult.studentDiagramUrl || aiFeedback.diagramResult.student_diagram_url || aiFeedback.studentDiagramUrl) && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 mb-2 block">Ảnh hình vẽ của học sinh:</span>
                  <div className="inline-block rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-1 shadow-xs max-w-xs">
                    <img
                      src={
                        (aiFeedback.diagramResult.studentDiagramUrl || aiFeedback.diagramResult.student_diagram_url || aiFeedback.studentDiagramUrl)!.startsWith('http') ||
                        (aiFeedback.diagramResult.studentDiagramUrl || aiFeedback.diagramResult.student_diagram_url || aiFeedback.studentDiagramUrl)!.startsWith('/')
                          ? (aiFeedback.diagramResult.studentDiagramUrl || aiFeedback.diagramResult.student_diagram_url || aiFeedback.studentDiagramUrl)!
                          : `/${aiFeedback.diagramResult.studentDiagramUrl || aiFeedback.diagramResult.student_diagram_url || aiFeedback.studentDiagramUrl}`
                      }
                      alt="Ảnh hình vẽ bài làm"
                      className="max-h-48 rounded-lg object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-sm font-bold text-slate-800">
                {isMC ? `Giải thích ${q.label}` : `Lời giải ${q.label}`}
              </label>
              {aiFeedback?.comprehensionLevel && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  🎯 {aiFeedback.comprehensionLevel === 'HOAN_HAO' ? 'Tư duy hoàn hảo' : aiFeedback.comprehensionLevel === 'HIEU_BAI' ? 'Hiểu bài tốt' : aiFeedback.comprehensionLevel === 'NHAM_LAN' ? 'Có sai sót nhỏ' : 'Cần xem lại'}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {readonly && aiFeedback && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
                  🎯 Điểm: {aiFeedback.score ?? 0} / {aiFeedback.maxScore ?? 10}
                </span>
              )}
              {onToggleHint && (
                <button 
                  data-hint-toggle="true"
                  onClick={() => onToggleHint(q.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-semibold text-xs cursor-pointer transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gợi ý</span>
                </button>
              )}
            </div>
          </div>

          {/* Random Guess Warning Banner */}
          {aiFeedback?.isRandomGuess && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>AI phát hiện câu trả lời có khả năng đoán mò / chưa thể hiện đủ bước suy luận toán học.</span>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col flex-1 min-h-[140px] overflow-hidden relative">
            {editorContent && editorContent.trim().length > 0 ? (
              <div className="text-slate-800 leading-relaxed text-base break-words overflow-x-auto max-w-full">
                <HighlightedAnswer content={editorContent} aiFeedback={aiFeedback} />
              </div>
            ) : (
              <p className="text-slate-400 italic text-sm">Học sinh chưa nhập bài làm cho phần này.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-[350px]">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-slate-800">
              {isMC ? `Giải thích ${q.label}` : `Lời giải ${q.label}`}
            </label>
            <div className="flex space-x-2">
              {examType === 'practice' && onToggleHint && (
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
                <span className="flex items-center text-xs text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Đã lưu tự động
                </span>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
            <RichTextEditor
              content={editorContent}
              onChange={handleEditorChange}
              placeholder={isMC ? `Nhập giải thích cho ${q.label}...` : `Nhập lời giải chi tiết cho ${q.label}...`}
              className="flex-1 border-none rounded-none rounded-t-xl"
              minHeight="220px"
              rightCustomAction={
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleOpenDiagramQrModal}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
                    title="Chụp ảnh hình vẽ bài toán"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>📷 Tải ảnh hình vẽ</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCameraClick}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-primary text-white hover:bg-primary/90 rounded-lg font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
                    title="Chụp ảnh bài làm viết tay"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Chụp bài thi</span>
                  </button>
                </div>
              }
            />
            {diagramUrl && (
              <div className="p-2.5 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-emerald-900">Đã tải ảnh hình vẽ:</span>
                  <a
                    href={diagramUrl.startsWith('http') || diagramUrl.startsWith('/') ? diagramUrl : `/${diagramUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline font-medium hover:text-primary/80"
                  >
                    Xem ảnh
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => onAnswerChange(`${q.id}_diagram`, '')}
                  className="text-rose-600 hover:text-rose-700 font-bold text-xs cursor-pointer"
                >
                  Xóa ảnh
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Quét mã QR */}
      <MobileQrUploadModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        sessionId={qrSessionId}
        onUploadSuccess={handleQrUploadSuccess}
        onSwitchToInAppCamera={() => {
          setIsQrModalOpen(false)
          setIsInAppCameraOpen(true)
        }}
      />

      {/* Modal Quét mã QR Hình vẽ */}
      <MobileQrUploadModal
        isOpen={isDiagramQrModalOpen}
        onClose={() => setIsDiagramQrModalOpen(false)}
        sessionId={diagramQrSessionId}
        uploadType="diagram"
        onUploadSuccess={(_text, dUrl) => {
          if (dUrl) {
            onAnswerChange(`${q.id}_diagram`, dUrl)
          }
        }}
      />

      {/* Modal Chụp trực tiếp bằng In-App Camera WebRTC */}
      <InAppCameraModal
        isOpen={isInAppCameraOpen}
        onClose={() => setIsInAppCameraOpen(false)}
        onUploadSuccess={handleQrUploadSuccess}
      />

      {/* Step-by-Step Rubric Breakdown (Chi tiết chấm điểm từng bước) */}
      {readonly && aiFeedback?.stepResults && aiFeedback.stepResults.length > 0 && (
        <div className="mt-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 flex-wrap gap-2">
            <h4 className="flex items-center gap-2 text-slate-800 font-bold text-base">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Chi tiết chấm điểm từng bước (Rubric)
            </h4>
            {aiFeedback.isAlternativeMethod && (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold flex items-center gap-1 shadow-2xs">
                ✨ Học sinh giải theo phương pháp tương đương hợp lệ
              </span>
            )}
          </div>

          <div className="space-y-3">
            {aiFeedback.stepResults.map((step) => {
              const isPass = step.is_correct || step.score > 0
              return (
                <div 
                  key={step.step}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isPass 
                      ? 'bg-emerald-50/50 border-emerald-200/80' 
                      : 'bg-rose-50/40 border-rose-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {isPass ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <span className="font-bold text-slate-800 text-sm truncate">
                        Bước {step.step}: {step.title}
                      </span>
                    </div>
                    <span 
                      className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isPass 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isPass ? `+${step.score}` : '0.0'} / {step.max_score} đ
                    </span>
                  </div>

                  {!isPass && (
                    <div className="mt-2.5 pt-2 border-t border-rose-100 text-xs text-slate-700 space-y-1">
                      {step.error_location && (
                        <div className="bg-white/80 p-2 rounded-lg border border-rose-200">
                          <span className="font-bold text-rose-600">Vị trí sai: </span>
                          <MathText content={step.error_location} className="inline" />
                        </div>
                      )}
                      {step.deduction_reason && (
                        <p className="text-rose-600 font-medium pl-1">
                          ⚠️ {step.deduction_reason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Model Solution Guide (Lời giải chi tiết đối chiếu) */}
      {readonly && (q.solution_guide || aiFeedback?.aiExplanation) && (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm overflow-hidden">
          <h4 className="flex items-center gap-2 text-emerald-800 font-bold text-base mb-3">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Lời giải chi tiết (Đáp án chuẩn)
          </h4>
          <div className="text-slate-800 leading-relaxed max-w-full overflow-x-auto">
            <MathText content={q.solution_guide || aiFeedback?.aiExplanation || ''} />
          </div>
        </div>
      )}

      {/* VIP Reasoning Review Box */}
      {readonly && aiFeedback?.aiReasoningRemark && (
        <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-5 shadow-sm">
          <h4 className="flex items-center justify-between text-purple-700 font-bold text-base mb-3">
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Đánh giá tư duy (VIP)
            </span>
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
              Điểm: {aiFeedback.reasoningScore}/10
            </span>
          </h4>
          <div className="text-slate-700">
            <MathText content={aiFeedback.aiReasoningRemark} />
          </div>
        </div>
      )}

      {/* Teacher Feedback (if any) */}
      {readonly && aiFeedback?.teacherFeedback && (
        <div className="mt-4 p-4 bg-white/50 border border-blue-100 rounded-xl">
          <p className="text-sm font-semibold text-slate-500 mb-1">Lời nhắn của giáo viên:</p>
          <p className="text-slate-700 italic">{aiFeedback.teacherFeedback}</p>
        </div>
      )}
    </div>
  )
}

export default function EssayQuestion({
  resultId,
  questionId,
  index,
  diagram_svg,
  diagramSvg,
  content,
  sharedContext,
  solution_guide,
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

  const renderDiagram = (rawDiagram?: string | null) => {
    if (!rawDiagram || typeof rawDiagram !== 'string') return null;
    const diagram = rawDiagram.trim();
    if (!diagram || diagram === 'null' || diagram === 'undefined' || diagram === 'none' || diagram === '[]' || diagram === '{}') {
      return null;
    }
    let clean = diagram;
    if (clean.includes('```')) {
      const match = clean.match(/```(?:xml|svg)?\s*([\s\S]*?)\s*```/i);
      if (match && match[1]) clean = match[1].trim();
    }
    const svgStart = clean.indexOf('<svg');
    const svgEnd = clean.lastIndexOf('</svg>');
    const isSvg = svgStart !== -1 && svgEnd !== -1 && svgEnd >= svgStart;

    const isImageUrl = !isSvg && (
      clean.startsWith('http://') || 
      clean.startsWith('https://') || 
      clean.startsWith('/') || 
      clean.startsWith('uploads/') || 
      clean.startsWith('data:image/')
    );

    if (!isSvg && !isImageUrl) {
      return null;
    }

    const finalSvg = isSvg ? clean.substring(svgStart, svgEnd + 6) : '';
    let imgSrc = clean;
    if (!isSvg && clean.startsWith('uploads/')) {
      imgSrc = `/${clean}`;
    }
    return (
      <div className="my-4 flex justify-center" data-testid="question-illustration">
        <div className="max-w-[540px] w-full flex items-center justify-center overflow-hidden py-1">
          {isSvg ? (
            <div 
              className="w-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-[380px] [&>svg]:h-auto [&>svg]:w-auto [&>svg]:mx-auto [&>svg>rect:first-child]:fill-transparent [&>svg>rect:first-child]:stroke-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(finalSvg) }} 
            />
          ) : (
            <img 
              src={imgSrc} 
              alt="Hình vẽ minh họa bài toán" 
              onError={(e) => {
                const container = e.currentTarget.closest('[data-testid="question-illustration"]');
                if (container) (container as HTMLElement).style.display = 'none';
              }}
              className="max-w-full max-h-[380px] h-auto w-auto object-contain mx-auto"
            />
          )}
        </div>
      </div>
    );
  };

  // Determine what to render on the left side
  const renderLeftContent = () => {
    if (isGroup) {
      return (
        <div className="prose prose-slate max-w-none mb-8">
          <div className="text-lg leading-relaxed">
            {typeof sharedContext === 'string' ? <MathText content={sharedContext} /> : sharedContext}
          </div>
          {renderDiagram(diagram_svg || diagramSvg)}
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
                              ? 'bg-white border-primary shadow-primary/5' 
                              : 'bg-white border-transparent hover:border-slate-200'
                            }
                            ${readonly ? 'cursor-default' : ''}
                          `}
                        >
                          <div className={`w-10 h-10 flex items-center justify-center font-bold rounded-lg transition-colors text-lg
                            ${isSelected
                              ? 'bg-primary text-white shadow-sm'
                              : (readonly ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-600 group-hover:bg-primary group-hover:text-white')
                            }
                          `}>
                            {opt.id}
                          </div>
                          <div className="flex-1">
                            <span className="text-lg font-medium text-slate-900">
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
      <div className="prose prose-slate max-w-none mb-8 text-lg leading-relaxed">
        {renderDiagram(diagram_svg || diagramSvg)}
        <MathText content={content || ''} />
      </div>
    )
  }

  // Determine what to render on the right side
  const renderEditors = () => {
    const questionsToRender = isGroup 
      ? subQuestions.map((q, i) => ({ 
          id: q.id, 
          label: `câu ${index + 1}${String.fromCharCode(97 + i)}`, 
          type: q.type,
          solution_guide: (q as any).solution_guide || (q as any).solutionGuide,
          correctAnswer: (q as any).correctAnswer
        }))
      : [{ 
          id: questionId, 
          label: `câu ${index + 1}`, 
          type: 'essay',
          solution_guide: solution_guide
        }];

    return (
      <div className="flex-1 py-8 pr-8 pl-6 flex flex-col max-w-3xl mr-auto w-full space-y-8">
        {questionsToRender.map((q) => (
          <EditorItem 
            key={q.id}
            q={q as any}
            answer={answers[q.id] || ''}
            explanation={explanations?.[q.id] || ''}
            diagramUrl={answers[`${q.id}_diagram`] || answers[`${questionId}_diagram`]}
            onAnswerChange={onAnswerChange || (() => {})}
            isGroup={!!isGroup}
            examType={examType}
            readonly={readonly}
            aiFeedback={aiFeedbacks?.[q.id] || aiFeedbacks?.[questionId]}
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
      <div className="w-1/2 overflow-y-auto p-8 border-r border-slate-200 bg-white">
        <div className="max-w-xl ml-auto">
          <div className="flex items-center justify-between mb-6">
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-lg uppercase">
              Câu hỏi {index + 1}
            </span>
            
            <div className="flex items-center gap-2">
              {lectureUrl && (
                <Link
                  href={lectureUrl}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-full font-semibold text-sm transition-all active:scale-95"
                  title="Xem bài giảng liên quan"
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="hidden sm:inline">Bài giảng</span>
                </Link>
              )}
              <button
                onClick={() => setIsReportModalOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm cursor-pointer transition-all active:scale-95 bg-red-50 text-red-600 hover:bg-red-100`}
                title={readonly ? "Kháng cáo" : "Báo lỗi"}
              >
                <AlertTriangle className="w-5 h-5" />
                <span className="hidden sm:inline">{readonly ? "Kháng cáo" : "Báo lỗi"}</span>
              </button>
              <button
                onClick={onToggleFlag}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm cursor-pointer transition-all active:scale-95 ${
                  isFlagged 
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
      <div className="w-1/2 overflow-y-auto bg-slate-50">
        {renderEditors()}
      </div>

      {isReportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {readonly ? 'Kháng cáo' : 'Báo lỗi'}
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              {readonly ? 'Nêu rõ lý do bạn muốn kháng cáo cho câu hỏi này.' : 'Vui lòng mô tả lỗi của câu hỏi (sai đề, thiếu thông tin, lỗi chính tả, ...)'}
            </p>
            <textarea
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value)}
              placeholder="Nhập nội dung..."
              className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-slate-700"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-semibold transition-colors"
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

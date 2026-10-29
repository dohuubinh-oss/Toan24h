'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Loader2,
  AlertCircle,
  FileCheck2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { QuestionBlock } from '@/types/question'
import { apiFetch } from '@/lib/api'
import { toast } from '@/components/ui/ToastProvider'
import { formatTextToHtml, formatQuestionContent, formatSolutionGuide, ensureMathDelimiters, cleanQuestionPrefix } from './utils/questionTextFormatter'

export interface AiQuestionExtractModalProps {
  isOpen: boolean
  onClose: () => void
  onExtracted: (blocks: QuestionBlock[], rawJson?: string) => void
  defaultGrade?: number | string | null
}

interface ImageFileItem {
  id: string
  file: File
  previewUrl: string
}

export default function AiQuestionExtractModal({
  isOpen,
  onClose,
  onExtracted,
  defaultGrade,
}: AiQuestionExtractModalProps) {
  const [images, setImages] = useState<ImageFileItem[]>([])
  const [selectedGrade, setSelectedGrade] = useState<string>(
    defaultGrade ? defaultGrade.toString() : ''
  )
  const [isExtracting, setIsExtracting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      if (defaultGrade) {
        setSelectedGrade(defaultGrade.toString())
      }
    } else {
      // Clean up object URLs to avoid memory leaks
      images.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      setImages([])
      setIsExtracting(false)
      setStatusMessage('')
      setErrorMessage(null)
    }
  }, [isOpen, defaultGrade])

  if (!isOpen) return null

  const handleAddFiles = (selectedFiles: FileList | File[]) => {
    setErrorMessage(null)
    const fileArray = Array.from(selectedFiles).filter((file) =>
      file.type.startsWith('image/')
    )

    if (fileArray.length === 0) {
      setErrorMessage('Vui lòng chọn định dạng ảnh hợp lệ (JPG, PNG, WebP...)')
      return
    }

    if (images.length + fileArray.length > 10) {
      setErrorMessage('Chỉ được chọn tối đa 10 ảnh cùng lúc.')
      return
    }

    const newItems: ImageFileItem[] = fileArray.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
    }))

    setImages((prev) => [...prev, ...newItems])
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleAddFiles(e.target.files)
      e.target.value = '' // Reset to allow re-selecting same files
    }
  }

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((item) => item.id === id)
      if (target) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return prev.filter((item) => item.id !== id)
    })
  }

  // Handle Clipboard Paste (Ctrl+V / Cmd+V)
  const handlePasteEvent = (e: React.ClipboardEvent | ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    const imageFiles: File[] = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) {
          imageFiles.push(file)
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault()
      handleAddFiles(imageFiles)
      toast.success(`Đã nhận diện và thêm ${imageFiles.length} ảnh từ Clipboard!`)
    }
  }

  // Listen to window paste when modal is open
  useEffect(() => {
    if (!isOpen) return

    const handleGlobalPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && (target as HTMLInputElement).type === 'text') {
        return
      }
      handlePasteEvent(e)
    }

    window.addEventListener('paste', handleGlobalPaste)
    return () => {
      window.removeEventListener('paste', handleGlobalPaste)
    }
  }, [isOpen])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (images.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 ảnh đề thi')
      return
    }

    try {
      setIsExtracting(true)
      setStatusMessage('Đang tải ảnh lên máy chủ...')

      const formData = new FormData()
      images.forEach((item) => {
        formData.append('files', item.file)
      })
      if (selectedGrade) {
        formData.append('grade', selectedGrade)
      }

      setStatusMessage('Gemini AI đang bóc tách câu hỏi, công thức LaTeX & cắt hình học...')

      const response: any = await apiFetch('/questions/extract-ai', {
        method: 'POST',
        body: formData,
      })

      let extractedBlocks: QuestionBlock[] = []
      if (response && response.data && Array.isArray(response.data)) {
        extractedBlocks = response.data
      } else if (Array.isArray(response)) {
        extractedBlocks = response
      } else {
        throw new Error('Dữ liệu trả về từ AI không đúng cấu trúc danh sách câu hỏi')
      }

      // Chuẩn hóa đúng 100% CẤU TRÚC ĐẦU RA JSON MẪU (OUTPUT SCHEMA) của người dùng:
      // Block: shared_content, type_question, questions (TUYỆT ĐỐI KHÔNG CÓ is_group)
      // Question: content, type, grade, topic, difficulty_level, difficulty_point, point, tags, options, correct_answer, solution_guide, hint, quick_solve_tips, general_method, mistakes
      const standardJsonBlocks = extractedBlocks.map((block) => {
        const hasShared = block.shared_content !== null && block.shared_content !== undefined && block.shared_content.trim() !== '';
        const questionsList = block.questions || [];
        const isGroup = (block.type_question?.toLowerCase() === 'group' || hasShared) && questionsList.length > 1;

        let finalShared = isGroup && hasShared ? cleanQuestionPrefix(block.shared_content) : null;
        let questions = [...questionsList];

        // Nếu chỉ có 1 câu hỏi con nhưng có shared_content dẫn dắt (như Câu 9), tự động gộp vào nội dung câu hỏi
        if (!isGroup && questions.length === 1 && hasShared) {
          const sc = cleanQuestionPrefix(block.shared_content!.trim());
          const qc = cleanQuestionPrefix(questions[0].content?.trim() || '');
          if (!qc.includes(sc)) {
            questions[0] = {
              ...questions[0],
              content: qc === '' ? sc : `${sc}\n${qc}`
            };
          }
          finalShared = null;
        }

        const blockDiagramSvg = block.diagram_svg || (block as any).diagramSvg || (questions[0]?.solution_guide && typeof questions[0]?.solution_guide === 'object' ? (questions[0].solution_guide.diagram_svg || questions[0].solution_guide.diagramSvg) : null) || null;

        return {
          shared_content: finalShared,
          diagram_svg: blockDiagramSvg,
          type_question: (isGroup ? 'group' : 'single') as 'group' | 'single',
          questions: questions.map((q) => {
            const cleanedOptions = (q.options || []).map((opt) => {
              const stripped = opt.replace(/^(?:<p>\s*)?[A-Da-d][.)]\s*/i, (match) =>
                match.startsWith('<p>') ? '<p>' : ''
              )
              return ensureMathDelimiters(stripped)
            })

            let rawAns = (q.correct_answer || '').replace(/^(?:<p>\s*)?[A-Da-d][.)]\s*/i, (match) =>
              match.startsWith('<p>') ? '<p>' : ''
            )
            // Nếu đáp án là chữ cái A, B, C, D thì map sang option tương ứng
            if (/^[A-Da-d]$/.test(rawAns.trim())) {
              const idx = rawAns.trim().toUpperCase().charCodeAt(0) - 65
              if (cleanedOptions[idx]) {
                rawAns = cleanedOptions[idx]
              }
            }
            const finalCorrectAnswer = ensureMathDelimiters(rawAns)

            const processedGuide = q.solution_guide && typeof q.solution_guide === 'object'
              ? {
                  ...q.solution_guide,
                  diagram_svg: q.solution_guide.diagram_svg || q.solution_guide.diagramSvg || null,
                  steps: Array.isArray(q.solution_guide.steps)
                    ? q.solution_guide.steps.map((st: any) => ({
                        ...st,
                        formula: st.formula ? ensureMathDelimiters(st.formula) : st.formula,
                      }))
                    : [],
                }
              : q.solution_guide || { steps: [], conclusion: '' }

            const qPoint = q.point !== undefined && q.point !== null && Number(q.point) > 0 ? Math.round(Number(q.point)) : 1

            return {
              content: cleanQuestionPrefix(q.content || ''),
              type: (q.type === 'Trắc nghiệm' ? 'Trắc nghiệm' : 'Tự luận') as 'Trắc nghiệm' | 'Tự luận',
              grade: q.grade || (selectedGrade ? (selectedGrade === 'chuyen_cap' ? 'chuyen_cap' : parseInt(selectedGrade, 10)) : 9),
              topic: q.topic || '',
              difficulty_level: q.difficulty_level || 'Thông hiểu',
              difficulty_point: q.difficulty_point !== undefined && q.difficulty_point !== null ? Number(q.difficulty_point) : 5.0,
              point: qPoint,
              tags: Array.isArray(q.tags) && q.tags.length > 0 ? q.tags : (q.topic ? [q.topic] : []),
              options: q.type === 'Tự luận' ? [] : cleanedOptions,
              correct_answer: finalCorrectAnswer,
              solution_guide: processedGuide,
              diagram_svg: (processedGuide && typeof processedGuide === 'object' ? processedGuide.diagram_svg : null) || (q as any).diagram_svg || null,
              hint: q.hint || '',
              short_answer: (q as any).short_answer || q.quick_solve_tips || '',
              quick_solve_tips: (q as any).short_answer || q.quick_solve_tips || '',
              general_method: q.general_method || '',
              mistakes: q.mistakes || '',
            }
          }),
        }
      })

      const rawJsonString = JSON.stringify(standardJsonBlocks, null, 2)
      onExtracted(standardJsonBlocks as unknown as QuestionBlock[], rawJsonString)
      onClose()
    } catch (err: any) {
      console.error('Lỗi khi bóc tách bằng AI:', err)
      const msg = err.message || 'Không thể bóc tách câu hỏi. Vui lòng thử lại.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsExtracting(false)
      setStatusMessage('')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-primary to-blue-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Bóc tách câu hỏi bằng AI</h3>
              <p className="text-xs text-white/80 mt-0.5">
                Nhận diện câu hỏi, công thức LaTeX và tự động cắt hình học Oxy
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExtracting}
            aria-label="Đóng hộp thoại"
            className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl hover:bg-white/20 transition-colors text-white/90 hover:text-white disabled:opacity-40 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto" onPaste={handlePasteEvent}>
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Upload Dropzone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="ai-exam-files"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-primary" />
                Chọn ảnh đề thi
              </label>
              {images.length > 0 && (
                <span className="text-xs font-medium text-slate-500">
                  Đã chọn {images.length}/10 ảnh
                </span>
              )}
            </div>

            <input
              ref={fileInputRef}
              id="ai-exam-files"
              aria-label="Chọn ảnh đề thi"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              disabled={isExtracting}
              className="hidden"
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isExtracting && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                isDragOver
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50/70'
              } ${isExtracting ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Kéo thả nhiều ảnh đề thi vào đây, hoặc{' '}
                <span className="text-primary hover:underline">bấm để chọn</span>
              </p>
              <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1.5 flex-wrap">
                <span>Hỗ trợ PNG, JPG, JPEG, WebP. Tối đa 10 ảnh.</span>
                <span className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">Bấm Ctrl+V để dán trực tiếp ảnh chụp</span>
              </p>
            </div>
          </div>

          {/* Thumbnail Preview List */}
          {images.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Danh sách trang đề ({images.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-1">
                {images.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col"
                  >
                    <div className="h-24 w-full bg-slate-100 flex items-center justify-center overflow-hidden relative">
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute top-1.5 left-1.5 bg-slate-900/70 text-white text-xs font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs">
                        Trang {index + 1}
                      </span>
                      <button
                        type="button"
                        aria-label={`Xóa ảnh ${item.file.name}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveImage(item.id)
                        }}
                        disabled={isExtracting}
                        className="absolute top-1.5 right-1.5 min-w-[36px] min-h-[36px] w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-2 text-left">
                      <p
                        className="text-xs font-medium text-slate-700 truncate"
                        title={item.file.name}
                      >
                        {item.file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatFileSize(item.file.size)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extraction In-Progress Indicator */}
          {isExtracting && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2.5 text-primary font-semibold text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>{statusMessage}</span>
              </div>
              <div className="w-full bg-primary/20 rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-1.5 rounded-full animate-pulse w-3/4"></div>
              </div>
              <p className="text-xs text-slate-600">
                Gemini Vision đang số hóa bảng biến thiên thành HTML và tự động cắt sơ đồ hình học sang ảnh temp.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isExtracting}
            className="text-xs px-4"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isExtracting}
            className="text-xs px-5 bg-gradient-to-r from-blue-600 to-primary hover:from-blue-700 hover:to-primary/90 text-white shadow-sm flex items-center gap-2"
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang bóc tách...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Bóc tách câu hỏi
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

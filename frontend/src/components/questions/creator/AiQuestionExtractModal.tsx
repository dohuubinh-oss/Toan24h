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
import { formatTextToHtml, formatQuestionContent, formatSolutionGuide } from './utils/questionTextFormatter'

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

      // Hậu xử lý phương án, HTML formatting và các trường cần thiết
      const sanitizedBlocks: QuestionBlock[] = extractedBlocks.map((block) => ({
        ...block,
        shared_content: block.shared_content ? formatTextToHtml(block.shared_content) : '',
        questions: (block.questions || []).map((q) => {
          const cleanedOptions = (q.options || []).map((opt) =>
            opt.replace(/^(?:<p>\s*)?[A-Da-d][.)]\s*/i, (match) =>
              match.startsWith('<p>') ? '<p>' : ''
            )
          )

          return {
            ...q,
            content: formatQuestionContent(q.content),
            solution_guide: formatSolutionGuide(q.solution_guide),
            grade: q.grade || (selectedGrade ? (selectedGrade === 'chuyen_cap' ? 'chuyen_cap' : parseInt(selectedGrade, 10)) : 9),
            options: cleanedOptions,
            difficulty_level: q.difficulty_level || 'Thông hiểu',
            difficulty_point: q.difficulty_point || 5.0,
            point: q.point || (q.type === 'Trắc nghiệm' ? 0.5 : 1.0),
            tags: q.tags && q.tags.length > 0 ? q.tags : (q.topic ? [q.topic] : []),
          }
        }),
      }))

      const rawJsonString = JSON.stringify(sanitizedBlocks, null, 2)
      onExtracted(sanitizedBlocks, rawJsonString)
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
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-primary text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Bóc tách đề thi bằng AI</h3>
              <p className="text-xs text-white/80 mt-0.5">
                Nhận diện câu hỏi, công thức LaTeX và tự động cắt hình học Oxy
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExtracting}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/90 hover:text-white disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Target Grade Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="ai-extract-grade"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Khối lớp mục tiêu
              </label>
              <span className="text-[11px] text-slate-400">
                AI sẽ tự động gán chủ đề chuẩn theo khối lớp này
              </span>
            </div>
            <div className="relative">
              <select
                id="ai-extract-grade"
                aria-label="Khối lớp mục tiêu"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                disabled={isExtracting}
                className="w-full appearance-none px-3.5 h-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
              >
                <option value="">Tự động nhận diện theo đề thi</option>
                <option value="5">Lớp 5</option>
                <option value="6">Lớp 6</option>
                <option value="7">Lớp 7</option>
                <option value="8">Lớp 8</option>
                <option value="9">Lớp 9</option>
              </select>
            </div>
          </div>

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
              <p className="text-xs text-slate-400 mt-1">
                Hỗ trợ PNG, JPG, JPEG, WebP. Tối đa 10 ảnh (ví dụ Trang 1, Trang 2...).
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
                      <span className="absolute top-1.5 left-1.5 bg-slate-900/70 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                        Trang {index + 1}
                      </span>
                      <button
                        type="button"
                        aria-label="Xóa ảnh"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveImage(item.id)
                        }}
                        disabled={isExtracting}
                        className="absolute top-1.5 right-1.5 p-1 rounded-md bg-rose-600 text-white opacity-90 hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="p-2 text-left">
                      <p
                        className="text-xs font-medium text-slate-700 truncate"
                        title={item.file.name}
                      >
                        {item.file.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
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
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2.5 text-indigo-700 font-semibold text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>{statusMessage}</span>
              </div>
              <div className="w-full bg-indigo-200/60 rounded-full h-1.5 overflow-hidden">
                <div className="bg-indigo-600 h-1.5 rounded-full animate-pulse w-3/4"></div>
              </div>
              <p className="text-[11px] text-indigo-600/80">
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

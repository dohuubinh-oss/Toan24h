import React, { useRef, useState, useEffect } from 'react'
import {
  Shapes,
  Upload,
  Trash2,
  ImagePlus,
  Sparkles,
  Loader2,
  Copy,
  Check,
  X,
  ClipboardPaste
} from 'lucide-react'
import { uploadTempImage, refineGeometrySVG } from '@/lib/api'
import { toast } from '@/components/ui/ToastProvider'

interface SharedIllustrationCardProps {
  diagramSvg?: string | null
  isGroup?: boolean
  questionContent?: string
  solutionContent?: string
  onUpdateDiagram: (value: string | null) => void
}

export default function SharedIllustrationCard({
  diagramSvg,
  isGroup = false,
  questionContent = '',
  solutionContent = '',
  onUpdateDiagram
}: SharedIllustrationCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isAiGenerating, setIsAiGenerating] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [copied, setCopied] = useState(false)

  // Upload an image file (PNG, JPG, SVG, WebP)
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tập tin hình ảnh (PNG, JPG, WebP, SVG)!')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dung lượng ảnh vượt quá giới hạn 5MB!')
      return
    }

    setIsUploading(true)
    try {
      const url = await uploadTempImage(file)
      onUpdateDiagram(url)
      toast.success('Đã tải hình vẽ minh họa thành công!')
    } catch (err: any) {
      console.error('Lỗi khi tải ảnh:', err)
      toast.error(err?.message || 'Tải ảnh thất bại! Vui lòng thử lại.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
  }

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      processImageFile(file)
    }
  }

  // Handle Clipboard Paste (Ctrl+V / Cmd+V)
  const handlePasteEvent = async (e: React.ClipboardEvent | ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) {
          e.preventDefault()
          toast.info('Đang xử lý ảnh dán từ clipboard...')
          await processImageFile(file)
          break
        }
      }
    }
  }

  // Listen to window paste when card is mounted to support instant paste from GeoGebra snippet
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      handlePasteEvent(e)
    }

    window.addEventListener('paste', handleGlobalPaste)
    return () => {
      window.removeEventListener('paste', handleGlobalPaste)
    }
  }, [onUpdateDiagram])

  // Helper formatting for full text preview and Gemini payload
  const formatTextForPreview = (text: string) => {
    if (!text) return ''
    return text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  const fullQuestionPreview = formatTextForPreview(questionContent)
  const fullSolutionPreview = formatTextForPreview(solutionContent)

  // Handle AI Geometry Generation / Refinement
  const handleGenerateAiSvg = async () => {
    if (!questionContent.trim() && !solutionContent.trim() && !customPrompt.trim()) {
      toast.error('Cần có nội dung đề bài hoặc lời giải để AI dựng hình vẽ!')
      return
    }

    setIsAiGenerating(true)
    try {
      const generatedSvg = await refineGeometrySVG({
        content: fullQuestionPreview || questionContent,
        solution_guide: fullSolutionPreview || solutionContent,
        current_svg: diagramSvg || undefined,
        custom_prompt: customPrompt.trim() || undefined
      })

      onUpdateDiagram(generatedSvg)
      setShowAiModal(false)
      setCustomPrompt('')
      toast.success('✨ Đã dựng hoàn chỉnh hình vẽ minh họa bài toán bằng AI!')
    } catch (err: any) {
      console.error('Lỗi khi AI dựng hình:', err)
      toast.error(err?.message || 'Không thể tạo hình vẽ AI. Vui lòng thử lại!')
    } finally {
      setIsAiGenerating(false)
    }
  }

  const handleDelete = () => {
    if (confirm('Bạn có chắc muốn xóa hình vẽ minh họa này không?')) {
      onUpdateDiagram(null)
      toast.success('Đã xóa hình vẽ minh họa.')
    }
  }

  // Copy SVG code
  const handleCopySvg = () => {
    if (!diagramSvg) return
    navigator.clipboard.writeText(diagramSvg)
    setCopied(true)
    toast.success('Đã sao chép mã SVG vào clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  // Chuẩn hóa hiển thị: nếu là chuỗi SVG thì encode data-uri, nếu là URL ảnh thì dùng trực tiếp
  let imgSrc: string | null = null
  let isSvgDiagram = false
  if (diagramSvg && typeof diagramSvg === 'string' && diagramSvg.trim() !== '') {
    let cleanSvg = diagramSvg.trim()
    // Hỗ trợ trường hợp AI bọc mã trong block ```xml ... ``` hoặc ```svg ... ```
    if (cleanSvg.includes('```')) {
      const match = cleanSvg.match(/```(?:xml|svg)?\s*([\s\S]*?)\s*```/i)
      if (match && match[1]) {
        cleanSvg = match[1].trim()
      }
    }
    const svgStart = cleanSvg.indexOf('<svg')
    const svgEnd = cleanSvg.lastIndexOf('</svg>')
    if (svgStart !== -1 && svgEnd !== -1 && svgEnd >= svgStart) {
      cleanSvg = cleanSvg.substring(svgStart, svgEnd + 6)
      imgSrc = `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`
      isSvgDiagram = true
    } else if (cleanSvg.startsWith('http') || cleanSvg.startsWith('/')) {
      imgSrc = cleanSvg
      isSvgDiagram = false
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-white rounded-2xl shadow-sm border transition-all overflow-hidden flex flex-col ${
        isDragging
          ? 'border-primary ring-4 ring-primary/10 bg-primary/5'
          : 'border-slate-200'
      }`}
    >
      {/* Header */}
      <div className="p-4 bg-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
        <div className="flex items-center gap-2 px-2">
          <Shapes className="text-primary w-5 h-5" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">
            Hình vẽ minh họa bài toán
          </h2>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* AI Re-draw Button when image exists */}
          {imgSrc && (
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              disabled={isAiGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              title="Sử dụng AI tính toán tọa độ và sửa hình vẽ"
            >
              {isAiGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>Sửa hình minh hoạ</span>
            </button>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Tải ảnh vẽ từ máy tính hoặc bấm Ctrl+V để dán ảnh chụp GeoGebra"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span>{imgSrc ? 'Đổi ảnh' : 'Tải ảnh lên'}</span>
          </button>

          {isSvgDiagram && (
            <button
              type="button"
              onClick={handleCopySvg}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Sao chép mã SVG"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Đã chép' : 'Sao chép SVG'}</span>
            </button>
          )}

          {imgSrc && (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
              title="Xóa hình vẽ này"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-6">
        {imgSrc ? (
          <div className="flex flex-col items-center justify-center">
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 w-full flex flex-col items-center justify-center shadow-xs">
              <img
                src={imgSrc}
                alt="Hình vẽ minh họa bài toán"
                className="max-w-[520px] max-h-[380px] w-auto h-auto object-contain rounded-xl mx-auto shadow-xs bg-white p-2 border border-slate-200/60"
              />
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-primary/50 hover:bg-slate-50/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group relative"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center text-slate-400 group-hover:text-primary mb-3 transition-colors">
              <ImagePlus className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-4">
              Chưa có hình vẽ minh họa cho bài toán này
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAiModal(true)
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-800 bg-amber-100/80 hover:bg-amber-200/80 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Vẽ hình minh hoạ</span>
              </button>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-primary bg-primary/10 rounded-xl group-hover:bg-primary group-hover:text-white transition-all cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Tải ảnh lên</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 bg-slate-100 rounded-xl border border-slate-200/80">
                <ClipboardPaste className="w-3.5 h-3.5 text-slate-400" />
                <span>Bấm Ctrl+V để dán</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* AI Geometry Prompt Modal (Không làm mờ nền để giáo viên đọc đề bài và lời giải bên dưới) */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border-2 border-slate-300 ring-4 ring-black/5 relative animate-in fade-in zoom-in-95 duration-150 pointer-events-auto max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {imgSrc ? 'Sửa hình minh hoạ' : 'Vẽ hình minh hoạ'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Context Information: Hiển thị ĐẦY ĐỦ đề bài và lời giải như khi gửi lên Gemini */}
            <div className="space-y-4 mb-4 overflow-y-auto pr-1">
              <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/90 text-xs text-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <span>📌 Cơ sở dựng hình gửi lên Gemini:</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    (Đầy đủ nội dung đề bài & lời giải)
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Đề bài:
                  </span>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text font-sans">
                    {fullQuestionPreview || '(Chưa có nội dung đề bài)'}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Lời giải chi tiết:
                  </span>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text font-sans">
                    {fullSolutionPreview || '(Chưa có lời giải chi tiết)'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Chỉ dẫn bổ sung cho AI (Ưu tiên cao nhất khi vẽ lại / chỉ ra lỗi sai):</span>
                  <span className="text-[10px] font-normal text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Ưu tiên cao nhất
                  </span>
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ví dụ: 'Hình vẽ sai rồi, góc B không vuông mà là góc A', 'Vẽ thêm đường cao AH', 'Kẻ tiếp tuyến tại M'... Khi bạn chỉ ra lỗi sai, AI sẽ xem xét và tính toán lại tọa độ từ đầu thật cẩn thận."
                  rows={3}
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-slate-400 resize-none font-sans"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                disabled={isAiGenerating}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleGenerateAiSvg}
                disabled={isAiGenerating}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang dựng hình vector...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{imgSrc ? 'Vẽ lại ngay' : 'Vẽ hình ngay'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

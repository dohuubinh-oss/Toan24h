import React, { useRef, useState, useEffect } from 'react'
import DOMPurify from 'dompurify'
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
  ClipboardPaste,
  AlertCircle
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
  const [diagramTarget, setDiagramTarget] = useState<'question' | 'solution'>('question')
  const [aiError, setAiError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!showAiModal) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAiModal(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showAiModal])

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

  const buildPrefillPrompt = (target: 'question' | 'solution') => {
    const qText = formatTextForPreview(questionContent)
    const solText = formatTextForPreview(solutionContent)
    if (target === 'question') {
      return qText
        ? `Dựng hình minh họa cho ĐỀ BÀI (chỉ vẽ các đối tượng đề bài gốc, nét liền #0f172a, không vẽ đường phụ của lời giải):\n${qText}`
        : ''
    } else {
      return qText
        ? `Dựng hình minh họa ĐẦY ĐỦ CHO BÀI GIẢI (bao gồm cả nét đề bài #0f172a và các đường kẻ phụ nét đứt #2563eb theo lời giải):\n${qText}${solText ? `\n\nLời giải chi tiết:\n${solText}` : ''}`
        : ''
    }
  }

  // Handle Opening AI Modal with Question Context prefilled
  const handleOpenAiModal = (prefillWithQuestion = true, initialTarget: 'question' | 'solution' = 'question') => {
    setAiError(null)
    setDiagramTarget(initialTarget)
    if (prefillWithQuestion) {
      const prompt = buildPrefillPrompt(initialTarget)
      if (prompt) {
        setCustomPrompt(prompt)
      } else if (!customPrompt) {
        setCustomPrompt('')
      }
    }
    setShowAiModal(true)
  }

  const handleSwitchTarget = (newTarget: 'question' | 'solution') => {
    setDiagramTarget(newTarget)
    const prompt = buildPrefillPrompt(newTarget)
    if (prompt) {
      setCustomPrompt(prompt)
    }
  }

  // Handle AI Geometry Generation / Refinement
  const handleGenerateAiSvg = async () => {
    if (!questionContent.trim() && !solutionContent.trim() && !customPrompt.trim()) {
      toast.error('Thầy cô vui lòng cung cấp nội dung đề bài hoặc lời giải để AI dựng hình vẽ!')
      return
    }

    setIsAiGenerating(true)
    setAiError(null)
    try {
      const generatedSvg = await refineGeometrySVG({
        content: fullQuestionPreview || questionContent,
        solution_guide: fullSolutionPreview || solutionContent,
        current_svg: diagramSvg || undefined,
        custom_prompt: customPrompt.trim() || undefined,
        target: diagramTarget,
      })

      onUpdateDiagram(generatedSvg)
      setShowAiModal(false)
      setCustomPrompt('')
      setAiError(null)
      toast.success(
        diagramTarget === 'question'
          ? '✨ Đã dựng hoàn chỉnh hình vẽ cho ĐỀ BÀI (Nét liền)!'
          : '✨ Đã dựng hoàn chỉnh hình vẽ cho TOÀN BỘ BÀI GIẢI (Kèm đường phụ nét đứt)!'
      )
    } catch (err: any) {
      console.error('Lỗi khi AI dựng hình:', err)
      const errorMsg = err?.message || 'Chưa thể tạo hình vẽ AI. Thầy cô vui lòng kiểm tra lại chỉ dẫn hoặc dán ảnh chụp từ GeoGebra.'
      setAiError(errorMsg)
      toast.error(errorMsg)
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

  // Chuẩn hóa hiển thị: nếu là chuỗi SVG thì render trực tiếp an toàn, nếu là URL ảnh thì dùng thẻ img
  let imgSrc: string | null = null
  let isSvgDiagram = false
  let rawSvgContent = ''
  let isSolutionDiagram = false
  if (diagramSvg && typeof diagramSvg === 'string' && diagramSvg.trim() !== '') {
    let cleanSvg = diagramSvg.trim()
    if (cleanSvg === 'null' || cleanSvg === 'undefined' || cleanSvg === 'none' || cleanSvg === '[]' || cleanSvg === '{}') {
      cleanSvg = ''
    }
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
      rawSvgContent = cleanSvg.substring(svgStart, svgEnd + 6)
      imgSrc = `data:image/svg+xml;utf8,${encodeURIComponent(rawSvgContent)}`
      isSvgDiagram = true
    } else if (cleanSvg.startsWith('http://') || cleanSvg.startsWith('https://') || cleanSvg.startsWith('/') || cleanSvg.startsWith('data:image/')) {
      imgSrc = cleanSvg
      isSvgDiagram = false
    } else if (cleanSvg.startsWith('uploads/')) {
      imgSrc = `/${cleanSvg}`
      isSvgDiagram = false
    }

    isSolutionDiagram = Boolean(
      cleanSvg.includes('stroke-dasharray') ||
      cleanSvg.includes('dashed') ||
      cleanSvg.includes('#2563eb')
    )
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
          {imgSrc && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${
                isSolutionDiagram
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
              title={
                isSolutionDiagram
                  ? 'Hình vẽ bao gồm cả đường phụ chứng minh (nét đứt #2563eb)'
                  : 'Hình vẽ chỉ bao gồm các đối tượng trong đề bài gốc (nét liền)'
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSolutionDiagram ? 'bg-indigo-500' : 'bg-emerald-500'
                }`}
              />
              <span>{isSolutionDiagram ? 'Hình bài giải (Kèm nét đứt)' : 'Hình đề bài (Nét liền)'}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Nút Tạo ảnh / Sửa hình vẽ bằng AI */}
          {imgSrc ? (
            <button
              type="button"
              onClick={() => {
                setAiError(null)
                setShowAiModal(true)
              }}
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
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenAiModal(true, 'question')}
                disabled={isAiGenerating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 active:scale-98"
                title="Dựng hình chỉ có các yếu tố đề bài gốc (nét liền, không vẽ nét đứt của bài giải)"
              >
                {isAiGenerating && diagramTarget === 'question' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>Tạo hình đề bài</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAiModal(true, 'solution')}
                disabled={isAiGenerating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 active:scale-98"
                title="Dựng toàn bộ hình vẽ bao gồm cả đường kẻ phụ bài giải (nét đứt #2563eb)"
              >
                {isAiGenerating && diagramTarget === 'solution' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                )}
                <span>Tạo hình bài giải</span>
              </button>
            </div>
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
            <div className="w-full flex flex-col items-center justify-center py-1">
              {isSvgDiagram && rawSvgContent ? (
                <div 
                  data-testid="illustration-svg"
                  className="w-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-[380px] [&>svg]:h-auto [&>svg]:w-auto [&>svg]:mx-auto [&>svg>rect:first-child]:fill-transparent [&>svg>rect:first-child]:stroke-none"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rawSvgContent) }} 
                />
              ) : (
                <img
                  src={imgSrc}
                  alt="Hình vẽ minh họa bài toán"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  className="max-w-[520px] max-h-[380px] w-auto h-auto object-contain mx-auto"
                />
              )}
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
                  handleOpenAiModal(true, 'question')
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all shadow-xs cursor-pointer active:scale-98"
                title="Dựng hình chỉ có các yếu tố đề bài gốc (nét liền #0f172a, không vẽ nét đứt của bài giải)"
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Tạo hình đề bài (Nét liền)</span>
                <span className="sr-only">Vẽ hình minh hoạ</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenAiModal(true, 'solution')
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all shadow-xs cursor-pointer active:scale-98"
                title="Dựng toàn bộ hình vẽ bao gồm cả đường kẻ phụ bài giải (nét đứt #2563eb)"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Tạo hình bài giải (Kèm nét đứt)</span>
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-geom-modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none font-sans"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200/90 ring-4 ring-black/5 relative animate-in fade-in zoom-in-95 duration-150 pointer-events-auto max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shadow-xs ${
                  diagramTarget === 'solution'
                    ? 'bg-indigo-50 border-indigo-200/60 text-indigo-600'
                    : 'bg-blue-50 border-blue-200/60 text-blue-600'
                }`}>
                  <Sparkles className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 id="ai-geom-modal-title" className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    {imgSrc ? (
                      <span>Sửa hình minh hoạ</span>
                    ) : (
                      <>
                        <span>Vẽ hình minh hoạ</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                          diagramTarget === 'question'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {diagramTarget === 'question' ? 'Đề bài (Nét liền)' : 'Bài giải (Kèm nét đứt)'}
                        </span>
                      </>
                    )}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="min-w-[40px] min-h-[40px] p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Đóng cửa sổ"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Context Information: Hiển thị ĐẦY ĐỦ đề bài và lời giải như khi gửi lên Gemini */}
            <div className="space-y-4 mb-4 overflow-y-auto pr-1">
              {/* Phân biệt Mục tiêu dựng hình: Đề bài vs Toàn bộ bài giải */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>Mục tiêu dựng hình:</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {diagramTarget === 'question' ? 'Chỉ vẽ đề bài gốc' : 'Vẽ cả bài giải + đường phụ'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSwitchTarget('question')}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      diagramTarget === 'question'
                        ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/10 shadow-xs text-blue-950'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        diagramTarget === 'question'
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {diagramTarget === 'question' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-blue-900 flex items-center gap-1">
                        <span>1. Hình vẽ ĐỀ BÀI (Câu hỏi)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        Chỉ vẽ đối tượng trong đề gốc (nét liền <code className="text-[#0f172a] font-mono bg-white px-1 py-0.5 rounded border border-slate-200">#0f172a</code>). Không vẽ đường phụ giải.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchTarget('solution')}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      diagramTarget === 'solution'
                        ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/10 shadow-xs text-indigo-950'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        diagramTarget === 'solution'
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {diagramTarget === 'solution' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                        <span>2. Hình vẽ TOÀN BỘ BÀI GIẢI</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        Vẽ đầy đủ hình đề bài + các đường kẻ phụ chứng minh (nét đứt <code className="text-blue-600 font-mono bg-white px-1 py-0.5 rounded border border-slate-200">#2563eb</code>).
                      </p>
                    </div>
                  </button>
                </div>
              </div>

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
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                      Lời giải chi tiết:
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      diagramTarget === 'question'
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {diagramTarget === 'question'
                        ? 'Chỉ dùng kiểm chứng tọa độ (Bỏ qua đường phụ)'
                        : 'Nguồn trích xuất đường dựng phụ nét đứt #2563eb'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text font-sans">
                    {fullSolutionPreview || '(Chưa có lời giải chi tiết)'}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="ai-custom-prompt-input" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>Chỉ dẫn cho AI (Gemini):</span>
                    <span className="text-[10px] font-normal text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Ưu tiên cao nhất
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const prompt = buildPrefillPrompt(diagramTarget)
                      if (prompt) {
                        setCustomPrompt(prompt)
                        toast.success(
                          diagramTarget === 'question'
                            ? 'Đã tự động nạp chỉ dẫn dựng hình cho Đề bài!'
                            : 'Đã tự động nạp chỉ dẫn dựng hình cho Bài giải!'
                        )
                      } else {
                        toast.error('Chưa có nội dung để đưa vào chỉ dẫn.')
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                    title="Tự động sao chép nội dung phù hợp vào ô chỉ dẫn bên dưới"
                  >
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span>Tự động nạp chỉ dẫn theo mục tiêu</span>
                  </button>
                </div>
                <textarea
                  id="ai-custom-prompt-input"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ví dụ: 'Vẽ tam giác nhọn ABC', 'Kẻ thêm đường cao AH', 'Vẽ bảng biến thiên', 'Vẽ đồ thị hàm số y = 2x + 1'... AI sẽ tự động đọc hiểu đề bài và tính toán tọa độ để dựng hình chuẩn xác."
                  rows={3}
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-slate-400 resize-none font-sans"
                />
              </div>

              {/* In-Modal Alert Banner khi xảy ra lỗi */}
              {aiError && (
                <div className="bg-amber-50/95 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200 shadow-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1.5">
                    <div className="font-bold text-amber-950 flex items-center gap-1.5">
                      <span>{aiError}</span>
                    </div>
                    <div className="text-[11px] text-amber-800 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-amber-200/60">
                      💡 <strong>Gợi ý:</strong> AI sẽ tự động đọc hiểu đề bài và tính toán tọa độ để dựng hình. Nếu muốn tùy chỉnh nét vẽ, Thầy cô chỉ cần ghi chú ngắn gọn bằng tiếng Việt tự nhiên tại ô <em>"Chỉ dẫn bổ sung"</em> phía trên (ví dụ: <code>Vẽ tam giác nhọn ABC</code>, <code>Kẻ thêm đường cao AH và phân giác AD</code>, <code>Đổi góc vuông sang đỉnh A</code>), hoặc ấn <strong>Ctrl+V</strong> để dán trực tiếp ảnh chụp từ GeoGebra / sách bài tập.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiError(null)}
                    className="text-amber-500 hover:text-amber-700 p-1 rounded-lg hover:bg-amber-100/60 transition-colors cursor-pointer"
                    title="Đóng thông báo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                disabled={isAiGenerating}
                className="min-h-[40px] px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleGenerateAiSvg}
                disabled={isAiGenerating}
                className="min-h-[40px] inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-sm shadow-primary/20 cursor-pointer disabled:opacity-50 active:scale-98"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang dựng hình vector...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
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

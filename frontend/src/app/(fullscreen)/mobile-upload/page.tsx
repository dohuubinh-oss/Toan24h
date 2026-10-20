'use client'

import React, { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Camera, UploadCloud, CheckCircle2, AlertCircle, Loader2, RefreshCw, Trash2, PlusCircle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface CapturedPage {
  id: string
  file: File
  previewUrl: string
}

// Hàm nén ảnh và chuẩn hóa kích thước bằng HTML5 Canvas trên Client-side
async function compressImage(file: File, maxDim = 1600, quality = 0.8): Promise<File> {
  return new Promise((resolve) => {
    // Nếu môi trường không có window/Image (SSR fallback)
    if (typeof window === 'undefined') {
      resolve(file)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Downscale nếu kích thước vượt quá maxDim
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        // Vẽ ảnh lên canvas để chuẩn hóa và xóa bỏ EXIF nhạy cảm
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }
            const cleanName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
            const compressedFile = new File([blob], cleanName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => resolve(file)
      img.src = e.target?.result as string
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}

function MobileUploadContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')

  const [pages, setPages] = useState<CapturedPage[]>([])
  const [isCompressing, setIsCompressing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedPagesCount, setSubmittedPagesCount] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (pages.length >= 5) {
      setErrorMsg('Tối đa mỗi lượt bạn có thể chụp 5 trang bài làm.')
      return
    }

    setIsCompressing(true)
    setErrorMsg(null)

    try {
      // Nén ảnh trên Client-side trước khi đưa vào hàng đợi
      const compressed = await compressImage(file, 1600, 0.8)
      const url = URL.createObjectURL(compressed)
      const newPage: CapturedPage = {
        id: Math.random().toString(36).substring(2, 9),
        file: compressed,
        previewUrl: url,
      }
      setPages((prev) => [...prev, newPage])
    } catch (err: any) {
      console.error('Lỗi khi xử lý ảnh:', err)
      setErrorMsg('Không thể xử lý ảnh vừa chụp. Vui lòng thử lại.')
    } finally {
      setIsCompressing(false)
      // Reset input value để có thể chụp lại cùng 1 file nếu cần
      e.target.value = ''
    }
  }

  const handleRemovePage = (id: string) => {
    setPages((prev) => {
      const target = prev.find((p) => p.id === id)
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return prev.filter((p) => p.id !== id)
    })
  }

  const handleSubmit = async () => {
    if (!sessionId) {
      setErrorMsg('Thiếu mã phiên làm việc (Session ID). Vui lòng quét lại mã QR trên máy tính.')
      return
    }

    if (pages.length === 0) {
      setErrorMsg('Vui lòng chụp ít nhất 1 trang bài làm trước khi gửi.')
      return
    }

    setIsUploading(true)
    setErrorMsg(null)

    try {
      const formData = new FormData()
      pages.forEach((page) => {
        formData.append('files', page.file)
      })

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.toan6789.vn/api/v1'
      const response = await fetch(`${API_URL}/mobile-upload/${sessionId}`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Gửi ảnh thất bại')
      }

      setSubmittedPagesCount(pages.length)
      setIsSubmitted(true)
    } catch (err: any) {
      console.error('Upload failed:', err)
      setErrorMsg(err.message || 'Đã có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    pages.forEach((p) => {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl)
    })
    setPages([])
    setIsSubmitted(false)
    setErrorMsg(null)
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-200 max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Mã QR không hợp lệ</h2>
          <p className="text-sm text-slate-500 mb-6">
            Không tìm thấy mã phiên làm việc. Vui lòng mở lại mã QR trên màn hình máy tính và quét lại.
          </p>
        </div>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-slate-50 flex items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-emerald-100 max-w-sm w-full animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={44} className="animate-bounce" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Gửi thành công!</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Đã đồng bộ {submittedPagesCount} trang lời giải viết tay vào bài thi trên máy tính của bạn.
          </p>
          <Button
            variant="secondary"
            onClick={handleReset}
            className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw size={16} />
            Chụp thêm bài khác
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Mobile Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
              24h
            </div>
            <h1 className="font-bold text-slate-800 text-base">Toán 24h - Nộp bài tự luận</h1>
          </div>
          {pages.length > 0 && (
            <span className="text-xs font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-full">
              {pages.length}/5 trang
            </span>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-md w-full mx-auto p-5 flex flex-col justify-center">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-slate-800">Chụp bài làm viết tay</h2>
            <p className="text-xs text-slate-500">
              Chụp ảnh rõ nét, ngay ngắn. Tự động nén và hỗ trợ chụp nhiều trang liên tiếp.
            </p>
          </div>

          {/* Hidden File Input for Camera */}
          <input
            type="file"
            id="mobile-camera-input"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
            disabled={isCompressing || isUploading || pages.length >= 5}
          />

          {/* Multi-page List / Camera Trigger */}
          <div className="space-y-3">
            {pages.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {pages.map((page, idx) => (
                    <div
                      key={page.id}
                      className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group shadow-sm aspect-[3/4]"
                    >
                      <img
                        src={page.previewUrl}
                        alt={`Trang ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <FileText size={12} />
                        Trang {idx + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePage(page.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600/90 text-white hover:bg-rose-700 transition-colors shadow cursor-pointer"
                        title="Xóa trang này"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {pages.length < 5 && (
                  <button
                    type="button"
                    onClick={() => document.getElementById('mobile-camera-input')?.click()}
                    disabled={isCompressing}
                    className="w-full py-3.5 border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl flex items-center justify-center gap-2 text-primary font-bold text-sm transition-all cursor-pointer"
                  >
                    {isCompressing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Đang xử lý ảnh vừa chụp...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle size={18} />
                        <span>Chụp thêm trang tiếp theo ({pages.length + 1})</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <label
                htmlFor="mobile-camera-input"
                className={`cursor-pointer border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all text-center min-h-[220px] ${
                  isCompressing ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
                  {isCompressing ? (
                    <Loader2 size={30} className="animate-spin" />
                  ) : (
                    <Camera size={30} className="animate-pulse" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block">
                    {isCompressing ? 'Đang nén ảnh...' : 'Bấm vào đây để mở Camera chụp bài làm'}
                  </span>
                  <span className="text-xs text-slate-500 mt-1 block">
                    Chụp trực tiếp lời giải viết tay (Trang 1)
                  </span>
                </div>
              </label>
            )}
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium p-3 rounded-xl flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Action */}
          <Button
            onClick={handleSubmit}
            disabled={pages.length === 0 || isUploading || isCompressing}
            className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50 cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang nhận dạng & gửi bài...
              </>
            ) : (
              <>
                <UploadCloud className="w-5 h-5" />
                Gửi {pages.length > 0 ? `${pages.length} trang ` : ''}bài làm lên máy tính
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}

export default function MobileUploadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <MobileUploadContent />
    </Suspense>
  )
}

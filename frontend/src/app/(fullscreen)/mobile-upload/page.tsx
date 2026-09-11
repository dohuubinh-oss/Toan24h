'use client'

import React, { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Camera, UploadCloud, CheckCircle2, AlertCircle, Loader2, RefreshCw, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { apiFetch } from '@/lib/api'

function MobileUploadContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setErrorMsg(null)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleSubmit = async () => {
    if (!sessionId) {
      setErrorMsg('Thiếu mã phiên làm việc (Session ID). Vui lòng quét lại mã QR trên máy tính.')
      return
    }

    if (!selectedFile) {
      setErrorMsg('Vui lòng chụp hoặc chọn ảnh bài làm trước khi gửi.')
      return
    }

    setIsUploading(true)
    setErrorMsg(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
      const response = await fetch(`${API_URL}/mobile-upload/${sessionId}`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Gửi ảnh thất bại')
      }

      setIsSubmitted(true)
    } catch (err: any) {
      console.error('Upload failed:', err)
      setErrorMsg(err.message || 'Đã có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
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
            Lời giải viết tay đã được chuyển và tự động nhận diện vào bài thi trên máy tính của bạn.
          </p>
          <Button
            variant="secondary"
            onClick={handleReset}
            className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Chụp thêm ảnh khác
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
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-md w-full mx-auto p-5 flex flex-col justify-center">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-slate-800">Chụp bài làm viết tay</h2>
            <p className="text-xs text-slate-500">
              Hãy chụp ảnh rõ nét, đủ ánh sáng và ngay ngắn để AI nhận dạng chính xác nhất.
            </p>
          </div>

          {/* Photo / Camera Area */}
          <div>
            <input
              type="file"
              id="mobile-camera-input"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            {previewUrl ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30 shadow-md bg-slate-900 group">
                <img
                  src={previewUrl}
                  alt="Ảnh bài làm"
                  className="w-full max-h-[350px] object-contain mx-auto"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('mobile-camera-input')?.click()}
                  className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-xl backdrop-blur-sm flex items-center gap-1.5 shadow-lg"
                >
                  <RefreshCw size={14} />
                  Chụp lại
                </button>
              </div>
            ) : (
              <label
                htmlFor="mobile-camera-input"
                className="cursor-pointer border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all text-center min-h-[220px]"
              >
                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
                  <Camera size={30} />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block">
                    Bấm vào đây để mở Máy ảnh
                  </span>
                  <span className="text-xs text-slate-500 mt-1 block">
                    hoặc chọn ảnh có sẵn từ Thư viện
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
            disabled={!selectedFile || isUploading}
            className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xử lý & gửi bài...
              </>
            ) : (
              <>
                <UploadCloud className="w-5 h-5" />
                Gửi bài làm lên máy tính
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <MobileUploadContent />
    </Suspense>
  )
}

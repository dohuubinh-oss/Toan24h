'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { X, Camera, RefreshCw, Check, AlertCircle, Loader2, SwitchCamera, Sparkles } from 'lucide-react'
import { recognizeHandwriting } from '@/lib/api'
import { useToast } from '@/components/ui/ToastProvider'

interface InAppCameraModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: (text: string) => void
}

export default function InAppCameraModal({
  isOpen,
  onClose,
  onUploadSuccess
}: InAppCameraModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const toast = useToast()

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch (e) {
          // ignore
        }
      })
      streamRef.current = null
      setStream(null)
    }
  }, [])

  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    setErrorMessage(null)
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ truy cập máy ảnh trực tiếp.')
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      })

      streamRef.current = newStream
      setStream(newStream)

      if (videoRef.current) {
        videoRef.current.srcObject = newStream
        videoRef.current.play().catch(() => {})
      }
    } catch (err: any) {
      console.error('Camera access error:', err)
      let msg = 'Không thể truy cập máy ảnh. Vui lòng cấp quyền truy cập máy ảnh cho trình duyệt.'
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Bạn đã từ chối quyền truy cập máy ảnh. Vui lòng cho phép trong cài đặt trình duyệt để tiếp tục.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Không tìm thấy thiết bị máy ảnh trên thiết bị này.'
      }
      setErrorMessage(msg)
    }
  }, [])

  // Start camera on open, cleanup on close/unmount
  useEffect(() => {
    if (isOpen) {
      setCapturedBlob(null)
      setPreviewUrl(null)
      startCamera(facingMode)
    } else {
      stopStream()
      setCapturedBlob(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    }

    return () => {
      stopStream()
    }
  }, [isOpen, facingMode, startCamera, stopStream])

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleCapture = () => {
    if (!videoRef.current) return

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob)
          const url = URL.createObjectURL(blob)
          setPreviewUrl(url)
          // Pause camera stream while previewing
          stopStream()
        }
      },
      'image/jpeg',
      0.9
    )
  }

  const handleRetake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setCapturedBlob(null)
    startCamera(facingMode)
  }

  const handleToggleFacingMode = () => {
    stopStream()
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
  }

  const handleConfirmAndUpload = async () => {
    if (!capturedBlob) return

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const ocrText = await recognizeHandwriting(capturedBlob)
      if (!ocrText || ocrText.trim() === '') {
        toast.error('AI không nhận dạng được chữ viết trong ảnh. Vui lòng chụp rõ nét hơn.')
        handleRetake()
        return
      }

      toast.success('Nhận diện công thức & chữ viết tay thành công!')
      onUploadSuccess(ocrText)
      handleClose()
    } catch (err: any) {
      console.error('OCR error:', err)
      toast.error(err.message || 'Lỗi khi nhận dạng bài làm. Vui lòng thử lại.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    stopStream()
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setCapturedBlob(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700 max-w-lg w-full overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
              <Camera className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Chụp ảnh bài làm trực tiếp</h3>
              <p className="text-[11px] text-slate-400">Giữ nguyên trong bài thi • Không mất tiêu điểm</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewfinder / Preview Area */}
        <div className="relative w-full aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
          {errorMessage ? (
            <div className="p-6 text-center max-w-xs flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <AlertCircle size={28} />
              </div>
              <p className="text-xs text-rose-300 font-medium leading-relaxed">{errorMessage}</p>
              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={14} />
                Thử lại
              </button>
            </div>
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt="Ảnh chụp bài làm"
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Document Alignment Reticle */}
              <div className="absolute inset-5 border-2 border-dashed border-white/40 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="bg-black/50 backdrop-blur-xs text-[11px] text-white/80 px-3 py-1 rounded-full font-medium">
                  Căn bài làm vào giữa khung
                </div>
              </div>

              {/* Camera Switch button (top right inside viewfinder) */}
              <button
                type="button"
                onClick={handleToggleFacingMode}
                className="absolute top-3 right-3 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all active:scale-95 cursor-pointer shadow-md"
                title="Đổi camera trước/sau"
              >
                <SwitchCamera size={18} />
              </button>
            </>
          )}

          {/* AI Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 text-blue-400 flex items-center justify-center animate-pulse">
                <Sparkles className="w-6 h-6 animate-spin text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Gemini AI đang phân tích bài giải...</p>
                <p className="text-xs text-slate-400 mt-0.5">Nhận diện công thức Toán học & chữ viết tay</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4">
          {previewUrl ? (
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={handleRetake}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={15} />
                Chụp lại
              </button>
              <button
                type="button"
                onClick={handleConfirmAndUpload}
                disabled={isProcessing}
                className="flex-[2] py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang nhận diện...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Sử dụng ảnh này
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center py-2">
              <button
                type="button"
                onClick={handleCapture}
                disabled={!!errorMessage}
                className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 border-4 border-slate-700 shadow-xl flex items-center justify-center active:scale-90 transition-transform cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
                aria-label="Chụp ảnh"
              >
                <div className="w-12 h-12 rounded-full border-2 border-slate-900 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-blue-600 group-hover:scale-95 transition-transform" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

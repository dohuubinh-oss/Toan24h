'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Smartphone, Loader2, CheckCircle2, RefreshCw, Camera, Clock, AlertTriangle } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ui/ToastProvider'

interface MobileQrUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: (text: string) => void
  sessionId: string
  onSwitchToInAppCamera?: () => void
  onRefreshSession?: () => void
}

export default function MobileQrUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  sessionId,
  onSwitchToInAppCamera,
  onRefreshSession
}: MobileQrUploadModalProps) {
  const [origin, setOrigin] = useState('')
  const [activeSessionId, setActiveSessionId] = useState(sessionId)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes (600s)
  const [isExpired, setIsExpired] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  // Khi modal mở hoặc sessionId bên ngoài đổi, đồng bộ lại state
  useEffect(() => {
    if (isOpen) {
      setActiveSessionId(sessionId)
      setTimeLeft(600)
      setIsExpired(false)
      setIsSuccess(false)
      setIsSyncing(true)
    }
  }, [isOpen, sessionId])

  // Đếm ngược 10 phút (TTL)
  useEffect(() => {
    if (!isOpen || isExpired || isSuccess) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true)
          setIsSyncing(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, isExpired, isSuccess])

  // Hàm tạo mới phiên QR
  const handleRegenerateQr = useCallback(() => {
    if (onRefreshSession) {
      onRefreshSession()
    } else {
      const newSession = 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now()
      setActiveSessionId(newSession)
    }
    setTimeLeft(600)
    setIsExpired(false)
    setIsSuccess(false)
    setIsSyncing(true)
  }, [onRefreshSession])

  // Polling trạng thái từ backend
  useEffect(() => {
    if (!isOpen || !activeSessionId || isExpired || isSuccess) return

    const intervalId = setInterval(async () => {
      try {
        const res = await apiFetch(`/mobile-upload/${activeSessionId}`)
        if (res) {
          if (res.status === 'expired') {
            setIsExpired(true)
            setIsSyncing(false)
            clearInterval(intervalId)
            return
          }

          if (res.status === 'completed' && res.text) {
            clearInterval(intervalId)
            setIsSuccess(true)
            setIsSyncing(false)
            toast.success('Đã đồng bộ bài làm từ điện thoại thành công!')
            setTimeout(() => {
              onUploadSuccess(res.text)
              onClose()
            }, 800)
          }
        }
      } catch (err) {
        console.error('Polling mobile upload error:', err)
      }
    }, 1500)

    return () => {
      clearInterval(intervalId)
    }
  }, [isOpen, activeSessionId, isExpired, isSuccess, onUploadSuccess, onClose, toast])

  if (!isOpen) return null

  const uploadUrl = origin && activeSessionId ? `${origin}/mobile-upload?session=${activeSessionId}` : ''

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 sm:p-8 relative flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X size={20} />
        </button>

        {/* Icon & Title */}
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <Smartphone className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-1">
          Chụp bài làm bằng điện thoại
        </h3>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Dùng camera điện thoại quét mã QR bên dưới để chụp ảnh lời giải viết tay (hỗ trợ nhiều trang).
        </p>

        {/* TTL Timer Indicator */}
        {!isSuccess && !isExpired && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full text-xs font-semibold mb-4">
            <Clock size={13} className="animate-spin" style={{ animationDuration: '4s' }} />
            <span>Mã QR có hiệu lực: <strong className="font-mono text-amber-900">{formattedTime}</strong></span>
          </div>
        )}

        {/* QR Box */}
        <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-primary/30 shadow-inner flex flex-col items-center justify-center relative min-h-[240px] min-w-[240px]">
          {isSuccess ? (
            <div className="flex flex-col items-center gap-3 text-emerald-600 animate-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-16 h-16 animate-bounce" />
              <span className="font-bold text-base">Đã nhận diện thành công!</span>
            </div>
          ) : isExpired ? (
            <div className="flex flex-col items-center gap-3 text-slate-600 p-4 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <p className="text-xs font-semibold text-rose-600 max-w-[200px]">
                Mã QR đã hết hạn bảo mật (10 phút).
              </p>
              <button
                type="button"
                onClick={handleRegenerateQr}
                className="mt-1 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/25 hover:bg-primary/90 transition-all cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Tạo mã QR mới</span>
              </button>
            </div>
          ) : uploadUrl ? (
            <QRCodeSVG 
              value={uploadUrl} 
              size={210} 
              level="M" 
              includeMargin={false}
              className="rounded-lg shadow-sm"
            />
          ) : (
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          )}
        </div>

        {onSwitchToInAppCamera && (
          <button
            type="button"
            onClick={onSwitchToInAppCamera}
            className="mt-3 text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1.5 cursor-pointer py-1 px-3 rounded-lg hover:bg-primary/5 transition-colors"
          >
            <Camera size={14} />
            <span>Hoặc mở Camera trực tiếp trên thiết bị này</span>
          </button>
        )}

        {/* Status indicator */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-4 py-2.5 rounded-full w-full">
          {isSyncing && !isExpired && (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Đang chờ điện thoại chụp & gửi ảnh...</span>
            </>
          )}
          {isExpired && (
            <span className="text-rose-600 font-bold">
              Mã QR đã hết hạn. Vui lòng tạo mã mới.
            </span>
          )}
          {isSuccess && (
            <span className="text-emerald-600 font-bold">
              Đang hoàn tất đưa vào bài thi...
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

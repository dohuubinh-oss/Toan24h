'use client'

import React, { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Smartphone, Loader2, CheckCircle2, QrCode } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ui/ToastProvider'

interface MobileQrUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: (text: string) => void
  sessionId: string
}

export default function MobileQrUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  sessionId
}: MobileQrUploadModalProps) {
  const [origin, setOrigin] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  useEffect(() => {
    if (!isOpen || !sessionId) return

    setIsSuccess(false)
    setIsSyncing(true)

    const intervalId = setInterval(async () => {
      try {
        const res = await apiFetch(`/mobile-upload/${sessionId}`)
        if (res && res.status === 'completed' && res.text) {
          clearInterval(intervalId)
          setIsSuccess(true)
          setIsSyncing(false)
          toast.success('Đã đồng bộ bài làm từ điện thoại thành công!')
          setTimeout(() => {
            onUploadSuccess(res.text)
            onClose()
          }, 800)
        }
      } catch (err) {
        console.error('Polling mobile upload error:', err)
      }
    }, 1500)

    return () => {
      clearInterval(intervalId)
    }
  }, [isOpen, sessionId, onUploadSuccess, onClose, toast])

  if (!isOpen) return null

  const uploadUrl = origin ? `${origin}/mobile-upload?session=${sessionId}` : ''

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 sm:p-8 relative flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Icon & Title */}
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <Smartphone className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          Chụp bài làm bằng điện thoại
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Dùng camera điện thoại hoặc Zalo quét mã QR bên dưới để chụp ảnh lời giải viết tay.
        </p>

        {/* QR Box */}
        <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-primary/30 shadow-inner flex flex-col items-center justify-center relative min-h-[240px] min-w-[240px]">
          {isSuccess ? (
            <div className="flex flex-col items-center gap-3 text-emerald-600 animate-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-16 h-16 animate-bounce" />
              <span className="font-bold text-base">Đã nhận diện thành công!</span>
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

        {/* Status indicator */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 rounded-full w-full">
          {isSyncing && (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Đang chờ điện thoại gửi ảnh...</span>
            </>
          )}
          {isSuccess && (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              Đang hoàn tất đưa vào bài thi...
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

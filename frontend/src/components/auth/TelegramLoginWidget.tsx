'use client'

import React, { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { QrCode, X, CheckCircle2, Loader2, Send } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface TelegramLoginWidgetProps {
  botName: string
  onAuthSuccess: (user: any) => void
  linkUserId?: string
  buttonText?: string
}

export default function TelegramLoginWidget({
  botName,
  onAuthSuccess,
  linkUserId,
  buttonText,
}: TelegramLoginWidgetProps) {
  const onAuthSuccessRef = useRef(onAuthSuccess)
  
  const [showQrModal, setShowQrModal] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [deepLink, setDeepLink] = useState<string>('')
  const [qrStatus, setQrStatus] = useState<'idle' | 'waiting' | 'completed'>('idle')

  useEffect(() => {
    onAuthSuccessRef.current = onAuthSuccess
  }, [onAuthSuccess])

  // Start QR session - Immediately generate sessionId and deepLink so QR renders with 0ms delay
  const startQrSession = async () => {
    const localId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : Math.random().toString(36).substring(2, 10) + Date.now().toString(36)

    const initialLink = `https://t.me/${botName}?start=login_${localId}`
    setSessionId(localId)
    setDeepLink(initialLink)
    setShowQrModal(true)
    setQrStatus('waiting')

    try {
      const res = await apiFetch('/auth/telegram-qr/session', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: localId,
          linkUserId: linkUserId || undefined,
        }),
      })
      if (res && res.sessionId) {
        setSessionId(res.sessionId)
        if (res.deepLink) {
          setDeepLink(res.deepLink)
        }
      }
    } catch (err) {
      console.warn('Backend session registration fallback:', err)
    }
  }

  // Poll status when QR modal is open
  useEffect(() => {
    if (!showQrModal || !sessionId || qrStatus === 'completed') return

    const interval = setInterval(async () => {
      try {
        const res = await apiFetch(`/auth/telegram-qr/status/${sessionId}`)
        if (res && res.status === 'completed' && res.user) {
          setQrStatus('completed')
          clearInterval(interval)
          if (res.user) {
            localStorage.setItem('user', JSON.stringify(res.user))
            document.cookie = `userRole=${res.user.role}; path=/; max-age=86400; SameSite=Lax`
            if (res.user.grade) {
              document.cookie = `userGrade=${res.user.grade}; path=/; max-age=86400; SameSite=Lax`
            }
          }
          setTimeout(() => {
            setShowQrModal(false)
            onAuthSuccessRef.current(res.user)
          }, 800)
        }
      } catch (err) {
        console.error('Error polling Telegram QR status', err)
      }
    }, 1500)

    return () => clearInterval(interval)
  }, [showQrModal, sessionId, qrStatus])


  const defaultBtnText = linkUserId ? 'Liên kết tài khoản Telegram' : 'Đăng nhập với Telegram'
  const defaultModalTitle = linkUserId ? 'Liên kết tài khoản Telegram' : 'Đăng nhập với Telegram'

  return (
    <div className="flex flex-col items-center w-full gap-3 my-1">
      {/* Single Unified Telegram Button */}
      <button
        type="button"
        onClick={startQrSession}
        className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-[#24A1DE] hover:bg-[#208ec4] text-white font-semibold rounded-xl shadow-md shadow-[#24A1DE]/25 transition-all hover:scale-[1.01] active:scale-[0.99] text-sm group cursor-pointer"
      >
        <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        <span>{buttonText || defaultBtnText}</span>
      </button>

      {/* Modal QR & Mobile Login */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1.5 mb-5">
              <div className="w-12 h-12 rounded-full bg-sky-100 text-[#24A1DE] flex items-center justify-center mx-auto mb-2">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">{defaultModalTitle}</h3>
            </div>

            {qrStatus === 'completed' ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-lg font-bold text-slate-800">
                  {linkUserId ? 'Liên kết thành công!' : 'Đăng nhập thành công!'}
                </h4>
                <p className="text-sm text-slate-500">
                  {linkUserId ? 'Thông tin Telegram đã được cập nhật.' : 'Đang tự động chuyển hướng vào hệ thống...'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-200 rounded-xl">
                  {deepLink ? (
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                      <QRCodeSVG
                        value={deepLink}
                        size={200}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                  ) : (
                    <div className="w-[200px] h-[200px] flex items-center justify-center text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  )}
                  <span className="text-xs text-slate-500 mt-2.5 font-mono">
                    Bot: @{botName}
                  </span>
                </div>

                {/* Instructions */}
                <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3.5 text-xs text-sky-900 space-y-1.5">
                  <p className="font-bold text-sky-950">📌 Các bước thực hiện:</p>
                  <p>1. Dùng <strong>Camera điện thoại</strong> hoặc <strong>App Telegram</strong> quét mã QR trên.</p>
                  <p>2. Trên ứng dụng Telegram, nhấn nút <strong>Bắt đầu (Start)</strong>.</p>
                  <p>3. Màn hình máy tính sẽ <strong>tự động đăng nhập</strong> ngay lập tức!</p>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Đang đợi bạn nhấn Start trên Telegram...</span>
                </div>


              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

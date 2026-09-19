'use client'

import React, { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Smartphone, QrCode, ExternalLink, X, CheckCircle2, Loader2, Send } from 'lucide-react'
import { apiFetch } from '@/lib/api'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

interface TelegramLoginWidgetProps {
  botName: string
  buttonSize?: 'large' | 'medium' | 'small'
  cornerRadius?: number
  requestAccess?: string
  usePic?: boolean
  onAuthCallback: (user: any) => void
}

declare global {
  interface Window {
    onTelegramAuth: (user: TelegramUser) => void
  }
}

export default function TelegramLoginWidget({
  botName,
  buttonSize = 'large',
  cornerRadius = 8,
  requestAccess = 'write',
  usePic = true,
  onAuthCallback,
}: TelegramLoginWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onAuthCallbackRef = useRef(onAuthCallback)
  
  const [showQrModal, setShowQrModal] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [deepLink, setDeepLink] = useState<string>('')
  const [qrStatus, setQrStatus] = useState<'idle' | 'waiting' | 'completed'>('idle')
  const [isLocalhost, setIsLocalhost] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)

  useEffect(() => {
    onAuthCallbackRef.current = onAuthCallback
  }, [onAuthCallback])

  // Detect localhost
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname
      setIsLocalhost(host === 'localhost' || host === '127.0.0.1')
    }
  }, [])

  // Widget embedding logic (only if not localhost to avoid "Bot domain invalid")
  useEffect(() => {
    if (isLocalhost) return

    window.onTelegramAuth = (user) => {
      if (onAuthCallbackRef.current) {
        onAuthCallbackRef.current(user)
      }
    }

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', botName)
    script.setAttribute('data-size', buttonSize)
    if (cornerRadius !== undefined) {
      script.setAttribute('data-radius', cornerRadius.toString())
    }
    script.setAttribute('data-request-access', requestAccess)
    script.setAttribute('data-userpic', usePic.toString())
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.async = true

    const currentContainer = containerRef.current
    if (currentContainer) {
      currentContainer.appendChild(script)
    }

    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = ''
      }
    }
  }, [botName, buttonSize, cornerRadius, requestAccess, usePic, isLocalhost])

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
        body: JSON.stringify({ sessionId: localId }),
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
          }
          setTimeout(() => {
            setShowQrModal(false)
            onAuthCallbackRef.current(res.user)
          }, 800)
        }
      } catch (err) {
        console.error('Error polling Telegram QR status', err)
      }
    }, 1500)

    return () => clearInterval(interval)
  }, [showQrModal, sessionId, qrStatus])

  // Simulated login for instant testing in local dev
  const handleSimulatedLogin = async () => {
    if (!sessionId) return
    setIsSimulating(true)
    try {
      await apiFetch('/auth/telegram-qr/complete', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          id: 99998888,
          first_name: 'Học sinh Test',
          username: 'student_test',
        }),
      })
    } catch (err) {
      console.error('Simulation error:', err)
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    <div className="flex flex-col items-center w-full gap-3 my-2">
      {/* Telegram Official Widget Container (Only shown when not localhost) */}
      {!isLocalhost && (
        <div ref={containerRef} className="flex justify-center w-full"></div>
      )}

      {/* Button for Mobile Telegram App / QR Code */}
      <button
        type="button"
        onClick={startQrSession}
        className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl shadow-md shadow-sky-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] text-sm group"
      >
        <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        <span>Đăng nhập bằng Telegram (Điện thoại / Quét QR)</span>
      </button>

      {/* Modal QR & Mobile Login */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1.5 mb-5">
              <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-2">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Đăng nhập qua Telegram Điện thoại</h3>
              <p className="text-xs text-slate-500">
                Quét mã QR bằng điện thoại hoặc bấm nút mở ứng dụng Telegram bên dưới.
              </p>
            </div>

            {qrStatus === 'completed' ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-lg font-bold text-slate-800">Đăng nhập thành công!</h4>
                <p className="text-sm text-slate-500">Đang tự động chuyển hướng vào hệ thống...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  {deepLink ? (
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                      <QRCodeSVG
                        value={deepLink}
                        size={190}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                  ) : (
                    <div className="w-[190px] h-[190px] flex items-center justify-center text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  )}
                  <span className="text-[11px] text-slate-400 mt-2 font-mono">
                    Bot: @{botName}
                  </span>
                </div>

                {/* Direct Deep Link Button for Mobile Users */}
                {deepLink && (
                  <a
                    href={deepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition-all shadow-md text-sm text-center"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Mở ứng dụng Telegram trên Điện thoại</span>
                  </a>
                )}

                {/* Instructions */}
                <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3 text-xs text-sky-900 space-y-1.5">
                  <p className="font-bold text-sky-950">📌 Các bước thực hiện rất đơn giản:</p>
                  <p>1. Dùng <strong>Camera điện thoại</strong> quét mã QR ở trên (hoặc bấm nút mở Telegram).</p>
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

                {/* Test button for developer in localhost */}
                {isLocalhost && (
                  <div className="pt-2 border-t border-slate-100 text-center">
                    <button
                      type="button"
                      onClick={handleSimulatedLogin}
                      disabled={isSimulating}
                      className="text-[11px] text-slate-400 hover:text-sky-600 underline font-medium transition-colors"
                    >
                      {isSimulating ? 'Đang mô phỏng...' : '⚡ Bấm vào đây để test đăng nhập nhanh (Dev simulation)'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

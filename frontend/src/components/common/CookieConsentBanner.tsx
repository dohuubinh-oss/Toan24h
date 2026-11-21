'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const COOKIE_CONSENT_KEY = 'toan6789_cookie_consent'

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already accepted cookies
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
      if (!consent) {
        // Slight delay for smooth entrance
        const timer = setTimeout(() => setIsVisible(true), 400)
        return () => clearTimeout(timer)
      }
    } catch (_) {}
  }, [])

  const handleAccept = () => {
    try {
      localStorage.setItem(
        COOKIE_CONSENT_KEY,
        JSON.stringify({
          accepted: true,
          timestamp: new Date().toISOString(),
        })
      )
      if (typeof document !== 'undefined') {
        document.cookie = `${COOKIE_CONSENT_KEY}=true; path=/; max-age=31536000; SameSite=Lax`
      }
    } catch (_) {}
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <aside
      role="region"
      aria-label="Thông báo sử dụng Cookies"
      data-testid="cookie-consent-banner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-md bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-slate-900/10 animate-in fade-in slide-in-from-bottom-5 duration-300 font-sans"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
          <Cookie className="w-5 h-5" />
        </div>
        <div className="space-y-3 flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Trang web này sử dụng Cookies và các công cụ đo lường để tối ưu trải nghiệm học tập của bạn. Bằng việc tiếp tục sử dụng, bạn đồng ý với{' '}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              Chính sách bảo mật
            </Link>{' '}
            của chúng tôi.
          </p>
          <div className="flex items-center gap-2 pt-0.5">
            <Button
              type="button"
              onClick={handleAccept}
              className="h-9 px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-primary hover:from-blue-700 hover:to-primary/90 text-white shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
            >
              Đồng ý
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}

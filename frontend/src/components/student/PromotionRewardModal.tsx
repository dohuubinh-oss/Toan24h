'use client'

import React, { useState, useEffect } from 'react'
import { Gift, Sparkles, CheckCircle2, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface PromotionRewardModalProps {
  show?: boolean
  months?: number
  onClose?: () => void
}

export default function PromotionRewardModal({
  show,
  months: initialMonths,
  onClose,
}: PromotionRewardModalProps = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [months, setMonths] = useState(initialMonths || 1)

  useEffect(() => {
    if (show !== undefined) {
      setIsOpen(show)
      if (initialMonths) setMonths(initialMonths)
      return
    }

    if (typeof window !== 'undefined') {
      const storedMonths = localStorage.getItem('promo_reward_months')
      const urlParams = new URLSearchParams(window.location.search)
      const hasPromoQuery = urlParams.get('promo') === '1' || urlParams.get('registered') === 'vip1m'

      if (storedMonths) {
        const parsed = parseInt(storedMonths, 10)
        setMonths(parsed > 0 ? parsed : 1)
        setIsOpen(true)
      } else if (hasPromoQuery) {
        setMonths(1)
        setIsOpen(true)
      }
    }
  }, [show, initialMonths])

  if (!isOpen) return null

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('promo_reward_months')
    }
    setIsOpen(false)
    if (onClose) onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-reward-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 p-6 sm:p-8 text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3 right-3 min-w-[44px] min-h-[44px] p-2.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Đóng thông báo"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Gift Icon with Glowing Ring */}
        <div className="relative mx-auto w-20 h-20 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Gift className="w-8 h-8" aria-hidden="true" />
          </div>
          <span className="absolute -top-1 -right-1 p-1 bg-blue-600 text-white rounded-full shadow-md">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
        </div>

        {/* Badge */}
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 mb-3">
          Ưu đãi Mã Giới Thiệu
        </span>

        {/* Title */}
        <h2
          id="promo-reward-title"
          className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 tracking-tight"
        >
          Tặng Bạn {months} Tháng VIP! 🎉
        </h2>

        {/* Subtitle */}
        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          Mã giới thiệu đã kích hoạt thành công. Bạn được mở khóa trọn vẹn đặc quyền học tập không giới hạn trên Toán 6789.
        </p>

        {/* Benefits Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5 mb-6 shadow-xs">
          <div className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Mở khóa toàn bộ ngân hàng câu hỏi & đề thi chuẩn SGK</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Xem lời giải chi tiết và phương pháp giải nhanh mọi dạng bài</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Trợ lý AI phân tích điểm yếu và đề xuất bài tập cá nhân hóa</span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          type="button"
          onClick={handleDismiss}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-base shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <span>Bắt đầu học ngay</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

'use client'

import React from 'react'
import Link from 'next/link'
import { CheckCircle2, Sparkles } from 'lucide-react'

export interface HomePricingPlan {
  id: string
  name: string
  durationMonths: number
  price: number
  originalPrice?: number
  pricePerMonth: string
  discountBadge?: string
  topBadge?: string
  theme: 'blue' | 'green'
  description: string
  features: string[]
}

export const HOME_PRICING_PLANS: HomePricingPlan[] = [
  {
    id: '3_months',
    name: 'Gói 3 Tháng',
    durationMonths: 3,
    price: 675000,
    originalPrice: 900000,
    pricePerMonth: '225.000đ / tháng',
    discountBadge: 'Tiết kiệm 25%',
    topBadge: 'PHỔ BIẾN NHẤT',
    theme: 'blue',
    description: 'Lựa chọn phổ biến nhất cho giai đoạn ôn tập và bứt phá điểm số.',
    features: [
      'Không giới hạn làm đề thi và bài giảng lý thuyết',
      'Ngân hàng 50.000+ câu hỏi phân loại theo độ khó',
      'Hệ thống gợi ý bài tập khắc phục điểm yếu',
      'Ưu tiên hỗ trợ giải đáp thắc mắc 24/7',
    ],
  },
  {
    id: '1_year',
    name: 'Gói 1 Năm',
    durationMonths: 12,
    price: 1800000,
    originalPrice: 3600000,
    pricePerMonth: '150.000đ / tháng',
    discountBadge: 'Tiết kiệm 50%',
    topBadge: 'TIẾT KIỆM NHẤT',
    theme: 'green',
    description: 'Giải pháp đầu tư tiết kiệm và hiệu quả nhất cho cả năm học và ôn thi chuyển cấp.',
    features: [
      'Toàn bộ đặc quyền VIP cao cấp nhất',
      'Học tập không giới hạn trong 365 ngày',
      'Kho đề thi vào 10 độc quyền cập nhật mới liên tục',
      'Hỗ trợ lộ trình học tập cá nhân hóa 1-1',
    ],
  },
]

export default function HomePricing() {
  return (
    <section id="pricing" className="py-20 bg-slate-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Chọn Gói Học Phù Hợp Với Bạn
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            Mở khóa toàn bộ ngân hàng bài giảng, đề thi thông minh và lời giải chi tiết trên Toan6789.vn.
          </p>
        </div>

        {/* 2 Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {HOME_PRICING_PLANS.map((plan) => {
            const isBlue = plan.theme === 'blue'

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 border-2 ${
                  isBlue
                    ? 'border-blue-600 shadow-xl shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/15'
                    : 'border-emerald-500 shadow-xl shadow-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/15'
                }`}
              >
                {/* Top Badge (PHỔ BIẾN NHẤT / TIẾT KIỆM NHẤT) */}
                {plan.topBadge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className={`px-4 py-1 text-white text-xs font-black rounded-full shadow-md uppercase tracking-wider ${
                        isBlue
                          ? 'bg-blue-600'
                          : 'bg-emerald-700'
                      }`}
                    >
                      {plan.topBadge}
                    </span>
                  </div>
                )}

                <div>
                  {/* Plan Name & Discount Pill */}
                  <div className="flex items-center justify-between gap-3 mb-2 pt-2">
                    <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                    {plan.discountBadge && (
                      <span className="px-3 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-700 border border-rose-200">
                        {plan.discountBadge}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-500 min-h-[40px] leading-relaxed">
                    {plan.description}
                  </p>

                  {/* Price Section */}
                  <div className="mt-5 pb-5 border-b border-slate-100">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                        {plan.price.toLocaleString('vi-VN')}đ
                      </span>
                      {plan.originalPrice && (
                        <span className="text-base font-semibold text-slate-500 line-through">
                          {plan.originalPrice.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-blue-600 mt-1.5">
                      {plan.pricePerMonth}
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="my-6">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
                      ĐẶC QUYỀN BAO GỒM:
                    </p>
                    <ul className="space-y-3.5">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  <Link
                    href="/upgrade"
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg active:scale-98 min-h-[48px] ${
                      isBlue
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/25'
                    }`}
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Nâng cấp tài khoản</span>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

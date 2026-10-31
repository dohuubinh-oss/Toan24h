'use client'

import React from 'react'
import Link from 'next/link'
import { CheckCircle2, Sparkles, QrCode, Send, ShieldCheck, Zap } from 'lucide-react'

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
    description: 'Lựa chọn phổ biến cho giai đoạn ôn tập bứt phá điểm số và đánh giá năng lực học sinh.',
    features: [
      'Kích hoạt tự động tức thì qua VietQR trong 3 giây',
      'Báo cáo điểm số & thời gian học qua Telegram cho phụ huynh',
      'Không giới hạn làm đề thi và bài giảng lý thuyết Lớp 5 - 9',
      'Ngân hàng 50.000+ câu hỏi Toán có giải thích bước làm chi tiết',
      'Ưu tiên hỗ trợ giải đáp thắc mắc học tập 24/7',
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
    description: 'Giải pháp đầu tư tối ưu cho cả năm học, trang bị vững vàng cho kỳ thi vào 10 và vào 6 CLC.',
    features: [
      'Toàn bộ đặc quyền VIP của gói 3 tháng',
      'Kích hoạt tự động tức thì qua VietQR quét mã là học ngay',
      'Bot Telegram báo cáo tiến độ chi tiết & cảnh báo rời phòng thi',
      'Học tập không giới hạn 365 ngày cho toàn bộ Lớp 5, 6, 7, 8, 9',
      'Kho đề thi tuyển sinh vào 10 & vào 6 CLC cập nhật liên tục',
      'Phân tích điểm yếu và dự đoán phổ điểm thi bằng AI',
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
            Mở khóa toàn bộ ngân hàng bài giảng, đề thi thông minh, lời giải chi tiết và tính năng đồng hành cùng phụ huynh.
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

        {/* Parent Trust & VietQR Guarantee Banner */}
        <div className="mt-14 max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              Cam kết dịch vụ & Minh bạch thanh toán
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
              An tâm đồng hành cùng phụ huynh & học sinh
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  Kích hoạt VietQR tức thì trong 3s
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Quét mã QR qua ứng dụng mọi ngân hàng. Tài khoản tự động nâng cấp VIP 24/7 sau 3 giây, không cần chờ duyệt thủ công.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  Báo cáo Telegram cho phụ huynh
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bot tự động gửi kết quả làm bài, thời gian biểu và cảnh báo học sinh rời phòng thi trực tiếp đến điện thoại cha mẹ.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  Cam kết bảo đảm chất lượng
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Toàn bộ nội dung chuẩn GDPT mới. Đội ngũ giáo viên hỗ trợ 24/7 và chính sách hoàn tiền 100% trong 7 ngày nếu không hài lòng.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

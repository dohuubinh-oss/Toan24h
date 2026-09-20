'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  QrCode,
  Loader2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  HelpCircle,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { toast } from 'react-hot-toast'
import PayOSPaymentModal, { PayOSPaymentData } from '@/components/payment/PayOSPaymentModal'

interface Plan {
  id: string
  name: string
  durationMonths: number
  price: number
  originalPrice?: number
  pricePerMonth: string
  discountBadge?: string
  popular?: boolean
  bestValue?: boolean
  description: string
  features: string[]
}

const PLANS: Plan[] = [
  {
    id: '1_month',
    name: 'Gói 1 Tháng',
    durationMonths: 1,
    price: 200000,
    pricePerMonth: '200.000đ / tháng',
    description: 'Trải nghiệm học tập và làm quen với phương pháp luyện thi thông minh.',
    features: [
      'Toàn quyền truy cập tất cả bài giảng',
      'Làm đề thi trắc nghiệm & tự luận chuẩn cấu trúc',
      'Xem đáp án chi tiết và phương pháp giải',
      'Theo dõi tiến độ học tập cơ bản',
    ],
  },
  {
    id: '3_months',
    name: 'Gói 3 Tháng',
    durationMonths: 3,
    price: 450000,
    originalPrice: 600000,
    pricePerMonth: '150.000đ / tháng',
    discountBadge: 'Tiết kiệm 25%',
    popular: true,
    description: 'Lựa chọn phổ biến nhất cho giai đoạn ôn tập và bứt phá điểm số.',
    features: [
      'Toàn bộ quyền lợi gói 1 tháng',
      'Ngân hàng 50.000+ câu hỏi phân loại theo độ khó',
      'Hệ thống gợi ý bài tập khắc phục điểm yếu',
      'Ưu tiên hỗ trợ giải đáp thắc mắc 24/7',
    ],
  },
  {
    id: '9_months',
    name: 'Gói 9 Tháng',
    durationMonths: 9,
    price: 1080000,
    originalPrice: 1800000,
    pricePerMonth: '120.000đ / tháng',
    discountBadge: 'Tiết kiệm 40%',
    description: 'Đồng hành trọn vẹn năm học từ kiến thức nền tảng đến ôn thi cuối kỳ.',
    features: [
      'Toàn bộ quyền lợi gói 3 tháng',
      'Đồng hành xuyên suốt cả năm học (Kỳ 1 + Kỳ 2)',
      'Bộ đề thi thử học kỳ chọn lọc của các trường điểm',
      'Chuyên đề ôn thi chuyên sâu & mẹo bấm máy tính',
    ],
  },
  {
    id: '1_year',
    name: 'Gói 1 Năm',
    durationMonths: 12,
    price: 1200000,
    originalPrice: 2400000,
    pricePerMonth: '100.000đ / tháng',
    discountBadge: 'Tiết kiệm 50%',
    bestValue: true,
    description: 'Giải pháp đầu tư tiết kiệm và hiệu quả nhất cho cả năm học và ôn thi chuyển cấp.',
    features: [
      'Toàn bộ đặc quyền VIP cao cấp nhất',
      'Học tập không giới hạn trong 365 ngày',
      'Kho đề thi vào 10 độc quyền cập nhật mới liên tục',
      'Hỗ trợ lộ trình học tập cá nhân hóa 1-1',
    ],
  },
]

export default function UpgradePage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANS[1]) // Default 3_months
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // PayOS Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [paymentData, setPaymentData] = useState<PayOSPaymentData | null>(null)

  // Handle Payment Creation with Auth Check
  const handleCreatePayment = async (plan: Plan) => {
    // 1. Check Auth
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!userStr) {
      toast.error('Vui lòng đăng nhập để nâng cấp gói học')
      router.push('/login?redirect=/upgrade')
      return
    }

    setSelectedPlan(plan)
    setLoadingPlanId(plan.id)
    setError(null)

    try {
      const res = await apiFetch('/payments/create', {
        method: 'POST',
        body: JSON.stringify({ plan: plan.id }),
      })

      if (res && res.error) {
        if (res.error.includes('Unauthorized') || res.error.includes('401')) {
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
          router.push('/login?redirect=/upgrade')
          return
        }
        setError(res.error)
        toast.error(res.error)
        return
      }

      const txData = res?.transactionId ? res : res?.data
      if (txData && (txData.transactionId || txData.orderCode)) {
        setPaymentData({
          transactionId: txData.transactionId,
          orderCode: txData.orderCode,
          amount: txData.amount,
          plan: txData.plan,
          planName: plan.name,
          qrCode: txData.qrCode,
          checkoutUrl: txData.checkoutUrl,
          accountNumber: txData.accountNumber,
          accountName: txData.accountName,
          bin: txData.bin,
          content: txData.content || `T24H ${txData.orderCode || txData.transactionId}`,
        })
        setIsModalOpen(true)
      } else {
        toast.error('Không thể tạo mã thanh toán. Vui lòng đăng nhập lại.')
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo giao dịch')
      toast.error(err.message || 'Có lỗi xảy ra')
    } finally {
      setLoadingPlanId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/60 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NÂNG TẦM ĐIỂM SỐ TOÁN HỌC</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Chọn Gói Học Phù Hợp Với Bạn
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Mở khóa toàn bộ ngân hàng bài giảng, đề thi thông minh và lời giải chi tiết trên Toan6789.vn.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Pricing Cards Grid (4 plans) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {PLANS.map((plan) => {
            const isLoading = loadingPlanId === plan.id

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-3xl p-6 flex flex-col transition-all duration-300 border-2 ${
                  plan.popular
                    ? 'border-blue-600 shadow-xl shadow-blue-500/10 scale-[1.02]'
                    : plan.bestValue
                    ? 'border-emerald-500 shadow-xl shadow-emerald-500/10'
                    : 'border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Badges */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {plan.popular && (
                    <span className="px-3.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-black rounded-full shadow-md uppercase tracking-wider">
                      PHỔ BIẾN NHẤT
                    </span>
                  )}
                  {plan.bestValue && (
                    <span className="px-3.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-black rounded-full shadow-md uppercase tracking-wider">
                      TIẾT KIỆM NHẤT
                    </span>
                  )}
                </div>

                <div className="pt-2">
                  {/* Plan Name & Discount Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                    {plan.discountBadge && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-700 border border-rose-200">
                        {plan.discountBadge}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 min-h-[36px] line-clamp-2">{plan.description}</p>

                  {/* Pricing Display */}
                  <div className="mt-4 pb-4 border-b border-slate-100">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-900">
                        {plan.price.toLocaleString('vi-VN')}đ
                      </span>
                      {plan.originalPrice && (
                        <span className="text-sm font-semibold text-slate-400 line-through">
                          {plan.originalPrice.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-blue-600 mt-1">{plan.pricePerMonth}</div>
                  </div>

                  {/* Features List */}
                  <div className="my-6 flex-1">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                      Đặc quyền bao gồm:
                    </p>
                    <ul className="space-y-3">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Create Payment Button */}
                  <button
                    onClick={() => handleCreatePayment(plan)}
                    disabled={isLoading}
                    className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                      plan.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
                        : plan.bestValue
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    } disabled:opacity-50`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang tạo mã...</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4" />
                        <span>Tạo mã thanh toán PayOS</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Benefits & FAQ Banner */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Kích hoạt tức thì</h4>
              <p className="text-xs text-slate-500">
                Hệ thống PayOS tự động cộng thời hạn VIP trong vòng vài giây ngay sau khi bạn quét mã VietQR thành công.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Bảo mật & Chuẩn xác</h4>
              <p className="text-xs text-slate-500">
                Thanh toán qua cổng PayOS chuẩn Open Banking và VietQR Ngân hàng Nhà nước, an toàn tuyệt đối.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Hỗ trợ 24/7</h4>
              <p className="text-xs text-slate-500">
                Cần hỗ trợ thanh toán hoặc hóa đơn? Liên hệ ngay Hotline / Telegram Bot để được xử lý nhanh nhất.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PayOS Payment Modal Component */}
      <PayOSPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        paymentData={paymentData}
      />
    </div>
  )
}

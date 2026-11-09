'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Target,
  UserCheck,
  BookOpen,
  Award,
  Users,
  TrendingUp,
  Percent,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Gift,
  Coins,
  ChevronDown,
  HelpCircle,
  Share2,
  Wallet,
  GraduationCap,
} from 'lucide-react'
import HomeFooter from '@/components/home/HomeFooter'

const PRICING_PACKAGES = [
  { id: '1_month', name: 'Gói 1 Tháng', price: 300000, label: '300.000đ' },
  { id: '3_months', name: 'Gói 3 Tháng', price: 675000, label: '675.000đ (Phổ biến)', default: true },
  { id: '12_months', name: 'Gói 1 Năm', price: 1200000, label: '1.200.000đ (Tiết kiệm nhất)' },
]

const FAQS = [
  {
    q: 'Chương trình Affiliate toan6789.vn là gì?',
    a: 'Đây là chương trình hợp tác chia sẻ doanh thu dành cho tất cả mọi người (học sinh, phụ huynh, gia sư, thầy cô, sáng tạo nội dung). Khi bạn giới thiệu người học mới nâng cấp tài khoản VIP trên toan6789.vn, bạn sẽ nhận ngay 30% hoa hồng trên giá trị đơn hàng.',
  },
  {
    q: 'Tỷ lệ hoa hồng 30% được tính như thế nào?',
    a: 'Khi học sinh đăng ký tài khoản qua liên kết hoặc nhập mã giới thiệu của bạn và tiến hành thanh toán gói cước thành công qua cổng PayOS, hệ thống sẽ tự động trích đúng 30% giá trị giao dịch chuyển vào ví hoa hồng của bạn.',
  },
  {
    q: 'Tham gia làm đối tác có mất bất kỳ khoản phí nào không?',
    a: 'Hoàn toàn KHÔNG. Việc đăng ký tài khoản và kích hoạt mã đối tác Affiliate là hoàn toàn miễn phí 100%. Bạn không cần bỏ vốn và không bị áp đặt bất kỳ chỉ tiêu doanh số (KPI) nào.',
  },
  {
    q: 'Tôi theo dõi đơn hàng và hoa hồng ở đâu?',
    a: 'Bạn có thể xem trực tiếp số lượng người dùng đã đăng ký, doanh thu tạo ra và số dư hoa hồng khả dụng theo thời gian thực (realtime) ngay tại mục "Trang cá nhân > Mã Giới Thiệu & Hoa Hồng Đối Tác".',
  },
  {
    q: 'Quy trình rút tiền hoa hồng diễn ra như thế nào?',
    a: 'Khi số dư hoa hồng tích lũy đạt hạn mức tối thiểu, bạn có thể tạo yêu cầu rút tiền về tài khoản ngân hàng chính chủ của mình. Tiền sẽ được đối soát và chuyển khoản nhanh chóng.',
  },
]

export default function AboutPage() {
  const [selectedPackageId, setSelectedPackageId] = useState('3_months')
  const [referredCount, setReferredCount] = useState(10)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const activePackage = PRICING_PACKAGES.find((p) => p.id === selectedPackageId) || PRICING_PACKAGES[1]
  const totalRevenue = activePackage.price * referredCount
  const commissionRate = 0.3 // 30% Affiliate policy
  const estimatedCommission = Math.round(totalRevenue * commissionRate)

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-primary/20">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50 pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-slate-200/60">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-blue-200/30 to-emerald-200/20 blur-3xl -z-10 pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-blue-200 shadow-sm text-xs font-bold text-primary mb-6">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span>Nền Tảng Toán THCS Thông Minh & Cơ Hội Hợp Tác 30%</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto mb-6">
              Về Chúng Tôi &amp; Chương Trình{' '}
              <span className="text-primary">
                Đối Tác Affiliate 30%
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
              Đồng hành cùng học sinh THCS lớp 6, 7, 8, 9 bứt phá điểm số với phương pháp học tập chuẩn mực và sự tận tâm
              của đội ngũ giáo viên, đồng thời mang đến cơ hội gia tăng thu nhập thụ động bền vững cho đối tác cộng đồng.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <a
                href="#affiliate"
                className="w-full sm:w-auto px-7 py-3.5 bg-primary text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-primary/30 hover:bg-primary/95 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Percent className="w-4 h-4" />
                <span>Khám phá chính sách 30%</span>
              </a>
              <a
                href="#about"
                className="w-full sm:w-auto px-7 py-3.5 bg-white text-slate-700 font-bold text-sm sm:text-base rounded-2xl border border-slate-200/80 shadow-sm hover:bg-slate-50 hover:text-primary transition-all flex items-center justify-center gap-2"
              >
                <span>Về toan6789.vn</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Impact Numbers */}
        <section className="py-12 bg-white border-b border-slate-200/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              <div className="p-4 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-100">
                <p className="text-3xl sm:text-4xl font-black text-primary mb-1">50.000+</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-600">Học sinh & Thầy cô tin dùng</p>
              </div>
              <div className="p-4 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-100">
                <p className="text-3xl sm:text-4xl font-black text-emerald-600 mb-1">10.000+</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-600">Đề thi & Câu hỏi chọn lọc</p>
              </div>
              <div className="p-4 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-100">
                <p className="text-3xl sm:text-4xl font-black text-amber-500 mb-1">98%</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-600">Học sinh tiến bộ sau 1 kỳ</p>
              </div>
              <div className="p-4 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-100">
                <p className="text-3xl sm:text-4xl font-black text-primary mb-1">30%</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-600">Hoa hồng chia sẻ đối tác</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Về toan6789.vn */}
        <section id="about" className="py-20 sm:py-28 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100/70 text-primary text-xs font-bold uppercase tracking-wider mb-4">
              <GraduationCap className="w-4 h-4" />
              <span>Sứ Mệnh Của Chúng Tôi</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Biến Môn Toán THCS Trở Nên Trực Quan & Dễ Tiếp Cận Cho Mọi Học Sinh
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              toan6789.vn được xây dựng với khát vọng giúp mọi học sinh lớp 6, 7, 8, 9 không còn cảm giác sợ môn Toán.
              Chúng tôi chú trọng phương pháp sư phạm chuẩn mực, đồng hành sát sao cùng học sinh để cá nhân hóa lộ trình
              ôn luyện và giúp các em tự tin làm chủ kiến thức.
            </p>
          </div>

          {/* 4 Core Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <UserCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Đội Ngũ Giáo Viên Chuyên Toán Chấm Chữa Tận Tâm</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Từng bài giải tự luận và đề thi đều được chuẩn hóa theo barem chấm thi tuyển sinh chính thức. Thầy cô
                phân tích chi tiết từng bước lập luận, chỉ rõ lỗi sai thường gặp và uốn nắn cách trình bày để đạt điểm tối đa.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Chuẩn Khung Chương Trình Mới Bộ GD&ĐT</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Toàn bộ hệ thống bài giảng lý thuyết và kho đề ôn tập được cập nhật bám sát 3 bộ sách giáo khoa mới (Kết
                nối tri thức, Cánh diều, Chân trời sáng tạo), phân loại rõ 4 mức độ nhận thức.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Lời Giải Chi Tiết & Hình Vẽ Chuẩn Xác</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Mỗi bài tập đều có đáp án chi tiết, bảng biến thiên và hình vẽ hình học trực quan sắc nét. Học sinh dễ
                dàng tự học, tự ôn luyện tại nhà mà không bị gián đoạn kiến thức.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Bảng Xếp Hạng & Động Lực Thi Đua</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Hệ thống tích điểm, huy hiệu thành tích và bảng xếp hạng tuần/tháng giúp học sinh hào hứng học tập, biến
                việc luyện thi khô khan thành một hành trình chinh phục thử thách thú vị.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Chương trình Đối tác Affiliate 30% */}
        <section id="affiliate" className="py-20 sm:py-28 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-t border-slate-200/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4">
                <Gift className="w-4 h-4" />
                <span>Chính Sách Đối Tác Cộng Đồng</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4">
                Nhận Ngay{' '}
                <span className="text-emerald-600">
                  30% Hoa Hồng
                </span>{' '}
                Trên Mọi Đơn Hàng
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Chương trình Affiliate toan6789.vn mở ra cơ hội gia tăng thu nhập hấp dẫn dành cho mọi đối tác. Chỉ cần
                chia sẻ đường link hoặc mã giới thiệu, bạn nhận ngay 30% giá trị mỗi khi học sinh nâng cấp gói học.
              </p>
            </div>

            {/* 4 Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Percent className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-1.5">Tỷ lệ 30% trọn đời</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Mức chiết khấu hấp dẫn và cạnh tranh bậc nhất trong các nền tảng giáo dục trực tuyến hiện nay.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-1.5">Cộng tiền tức thì</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ngay sau khi học sinh quét mã VietQR PayOS thành công, hoa hồng 30% lập tức được cộng vào ví của bạn.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-1.5">Minh bạch realtime</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Theo dõi số lượt đăng ký, doanh thu chi tiết và lịch sử giao dịch rõ ràng tại trang cá nhân.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                  <Wallet className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-1.5">Không vốn, không rủi ro</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tham gia hoàn toàn miễn phí, không ép doanh số, phù hợp cho học sinh, phụ huynh và thầy cô.
                </p>
              </div>
            </div>

            {/* 3 Steps Guide */}
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm mb-16">
              <h3 className="text-2xl font-bold text-slate-900 text-center mb-10">
                3 Bước Đơn Giản Để Bắt Đầu Kiếm Thu Nhập
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 text-primary flex items-center justify-center font-black text-xl mb-4 border border-blue-100 shadow-sm">
                    1
                  </div>
                  <h4 className="font-bold text-slate-900 text-base mb-2">Đăng ký tài khoản miễn phí</h4>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Tạo tài khoản toan6789.vn trong 30 giây để nhận ngay mã giới thiệu độc quyền và link liên kết đối
                    tác.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl mb-4 border border-emerald-100 shadow-sm">
                    2
                  </div>
                  <h4 className="font-bold text-slate-900 text-base mb-2">Chia sẻ đến cộng đồng</h4>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Gửi mã hoặc link cho bạn bè, phụ huynh, hội nhóm học tập lớp 6, 7, 8, 9 qua Zalo, Facebook, TikTok.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-xl mb-4 border border-purple-100 shadow-sm">
                    3
                  </div>
                  <h4 className="font-bold text-slate-900 text-base mb-2">Nhận hoa hồng 30%</h4>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Mỗi khi học sinh nâng cấp khóa học, 30% giá trị gói cước tự động chuyển vào ví hoa hồng rút về ngân
                    hàng.
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Commission Calculator */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden mb-16">
              <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-emerald-400 mb-3">
                    <Coins className="w-4 h-4" />
                    <span>Công Cụ Dự Tính Thu Nhập Thực Tế</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                    Tính Toán Thu Nhập Hoa Hồng 30% Của Bạn
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2">
                    Kéo thanh trượt để xem thu nhập tiềm năng khi chia sẻ toan6789.vn tới các bạn học sinh.
                  </p>
                </div>

                {/* Calculator Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                  <div className="space-y-6">
                    {/* Choose Package */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Chọn gói khóa học phổ biến:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {PRICING_PACKAGES.map((pkg) => (
                          <button
                            key={pkg.id}
                            type="button"
                            onClick={() => setSelectedPackageId(pkg.id)}
                            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left border cursor-pointer ${
                              selectedPackageId === pkg.id
                                ? 'bg-primary text-white border-primary shadow-md'
                                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <p>{pkg.name}</p>
                            <p className="text-[11px] opacity-80 mt-0.5">{pkg.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Choose Referral Count */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Số lượng học sinh đăng ký:
                        </label>
                        <span className="text-lg font-black text-emerald-400">
                          {referredCount} <span className="text-xs font-normal text-slate-300">học sinh</span>
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={referredCount}
                        onChange={(e) => setReferredCount(parseInt(e.target.value, 10))}
                        className="w-full h-2.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                      />
                      <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                        <span>1 học sinh</span>
                        <span>50 học sinh</span>
                        <span>100 học sinh</span>
                      </div>
                    </div>
                  </div>

                  {/* Calculator Result Box */}
                  <div className="bg-white/10 rounded-2xl p-6 border border-white/15 text-center flex flex-col justify-center items-center">
                    <p className="text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                      Hoa Hồng Bạn Nhận Được (30%)
                    </p>
                    <div className="text-3xl sm:text-4xl font-black text-emerald-400 my-2">
                      {estimatedCommission.toLocaleString('vi-VN')} <span className="text-lg font-bold">VNĐ</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Tổng giá trị đơn hàng tạo ra:{' '}
                      <span className="font-bold text-white">{totalRevenue.toLocaleString('vi-VN')} VNĐ</span>
                    </p>
                    <div className="mt-4 pt-4 border-t border-white/10 w-full text-xs text-slate-400 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Thanh toán minh bạch, cộng dồn vào ví rút</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
                  >
                    <Gift className="w-5 h-5 text-slate-950" />
                    <span>Đăng Ký Tài Khoản & Nhận Mã Ngay</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>Giải Đáp Thắc Mắc</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Câu Hỏi Thường Gặp Về Chương Trình Affiliate</h3>
              </div>

              <div className="space-y-4">
                {FAQS.map((faq, index) => {
                  const isOpen = openFaqIndex === index
                  return (
                    <div
                      key={faq.q}
                      className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition-all shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(index)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-slate-900 hover:text-primary transition-colors cursor-pointer"
                      >
                        <span className="text-sm sm:text-base">{faq.q}</span>
                        <ChevronDown
                          className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-primary' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="py-16 sm:py-24 bg-gradient-to-r from-primary via-blue-600 to-indigo-700 text-white relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Bắt Đầu Hành Trình Học Toán &amp; Hợp Tác Cùng toan6789.vn
            </h2>
            <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
              Dù bạn là học sinh muốn nâng cao điểm số hay đối tác muốn đồng hành lan tỏa giải pháp học tập chất lượng
              cao, toan6789.vn luôn sẵn sàng chào đón bạn.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 bg-white text-primary font-black rounded-2xl shadow-xl hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Tạo tài khoản miễn phí</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/lectures"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Trải nghiệm bài giảng</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <HomeFooter />
    </div>
  )
}

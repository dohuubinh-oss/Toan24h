'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Target,
  UserCheck,
  BookOpen,
  Award,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  ChevronDown,
  GraduationCap,
} from 'lucide-react'
import HomeFooter from '@/components/home/HomeFooter'

const FAQS = [
  {
    q: 'toan6789.vn cung cấp những dịch vụ giáo dục gì?',
    a: 'toan6789.vn cung cấp các Khóa học trực tuyến, Dịch vụ hỗ trợ giáo dục và công nghệ Chấm bài tự động chuyên biệt cho học sinh THCS từ lớp 6, 7, 8 đến lớp 9 ôn thi vào 10; đồng thời giúp phụ huynh theo dõi sát sao tiến độ học tập của con qua Telegram Bot.',
  },
  {
    q: 'Nội dung kiến thức có bám sát chương trình GDPT mới không?',
    a: '100% nội dung bài giảng lý thuyết và kho đề thi tại toan6789.vn được xây dựng bám sát khung chương trình GDPT mới của Bộ Giáo dục & Đào tạo, đồng bộ với cả 3 bộ sách giáo khoa: Kết nối tri thức, Cánh diều và Chân trời sáng tạo.',
  },
  {
    q: 'Phương pháp chấm thi và hướng dẫn giải tại toan6789.vn có gì đặc biệt?',
    a: 'Mỗi câu hỏi và đề thi đều có lời giải chi tiết từng bước, kèm hình vẽ hình học trực quan chuẩn xác và barem điểm rõ ràng. Học sinh được rèn luyện kỹ năng trình bày tự luận mạch lạc để đạt điểm tối đa trong các kỳ thi chính thức.',
  },
  {
    q: 'Làm thế nào để học sinh theo dõi sự tiến bộ của mình?',
    a: 'Hệ thống tự động lưu trữ lịch sử làm bài, phân tích điểm mạnh, điểm yếu theo từng chuyên đề, và hiển thị biểu đồ tiến độ luyện đề trực quan giúp học sinh và phụ huynh nắm bắt chính xác mức độ tiến bộ qua từng tuần.',
  },
  {
    q: 'Tôi có thể học thử miễn phí trước khi đăng ký gói VIP không?',
    a: 'Có. Tất cả tài khoản mới đều có thể trải nghiệm các bài giảng lý thuyết trọng tâm và các đề thi thử miễn phí để đánh giá chất lượng trước khi quyết định nâng cấp gói học chuyên sâu.',
  },
]

export default function AboutPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-primary/20">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-50 pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-slate-200/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto mb-6">
              Về Chúng Tôi &amp; Sứ Mệnh{' '}
              <span className="text-primary">
                Kiến Tạo Toán Học THCS
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
              Cung cấp các Khóa học trực tuyến, Dịch vụ hỗ trợ giáo dục và công nghệ Chấm bài tự động giúp học sinh THCS lớp 6, 7, 8, 9 bứt phá điểm số với phương pháp học tập chuẩn mực và sự tận tâm của đội ngũ giáo viên chuyên môn.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <Link
                href="/register"
                className="w-full sm:w-auto px-7 py-3.5 bg-primary text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-primary/30 hover:bg-primary/95 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <GraduationCap className="w-5 h-5" />
                <span>Bắt đầu học ngay</span>
              </Link>
              <a
                href="#about"
                className="w-full sm:w-auto px-7 py-3.5 bg-white text-slate-700 font-bold text-sm sm:text-base rounded-2xl border border-slate-200/80 shadow-sm hover:bg-slate-50 hover:text-primary transition-all flex items-center justify-center gap-2"
              >
                <span>Tìm hiểu sứ mệnh</span>
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
                <p className="text-3xl sm:text-4xl font-black text-primary mb-1">100%</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-600">Bám sát SGK GDPT mới</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Về toan6789.vn */}
        <section id="about" className="py-20 sm:py-28 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Biến Môn Toán THCS Trở Nên Trực Quan &amp; Dễ Tiếp Cận Cho Mọi Học Sinh
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              toan6789.vn được xây dựng với khát vọng giúp mọi học sinh lớp 6, 7, 8, 9 không còn cảm giác sợ môn Toán.
              Chúng tôi chú trọng phương pháp sư phạm chuẩn mực, đồng hành sát sao cùng học sinh để cá nhân hóa lộ trình
              ôn luyện và giúp các em tự tin làm chủ kiến thức.
            </p>
          </div>

          {/* 4 Core Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
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
              <h3 className="text-xl font-bold text-slate-900 mb-2">Chuẩn Khung Chương Trình Mới Bộ GD&amp;ĐT</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Toàn bộ hệ thống bài giảng lý thuyết và kho đề ôn tập được cập nhật bám sát 3 bộ sách giáo khoa mới (Kết
                nối tri thức, Cánh diều, Chân trời sáng tạo), phân loại rõ 4 mức độ nhận thức.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mb-6">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Lời Giải Chi Tiết &amp; Hình Vẽ Chuẩn Xác</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Mỗi bài tập đều có đáp án chi tiết, bảng biến thiên và hình vẽ hình học trực quan sắc nét. Học sinh dễ
                dàng tự học, tự ôn luyện tại nhà mà không bị gián đoạn kiến thức.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Bảng Xếp Hạng &amp; Động Lực Thi Đua</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Hệ thống tích điểm, huy hiệu thành tích và bảng xếp hạng tuần/tháng giúp học sinh hào hứng học tập, biến
                việc luyện thi khô khan thành một hành trình chinh phục thử thách thú vị.
              </p>
            </div>
          </div>

          {/* 3 Steps Learning Journey */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm mb-20">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-10">
              Lộ Trình 3 Bước Bứt Phá Điểm Số Cùng toan6789.vn
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-primary flex items-center justify-center font-black text-xl mb-4 border border-blue-100 shadow-sm">
                  1
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-2">Học Lý Thuyết Trọng Tâm</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Nắm chắc các định lý, công thức cốt lõi và các dạng toán điển hình qua video và tài liệu súc tích, dễ nhớ.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl mb-4 border border-emerald-100 shadow-sm">
                  2
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-2">Luyện Đề Thi Theo Chặng</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Thi thử định kỳ theo các mốc: Giữa kì 1, Cuối kì 1, Giữa kì 2, Cuối kì 2 và đề tổng ôn tuyển sinh vào 10.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-xl mb-4 border border-teal-100 shadow-sm">
                  3
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-2">Chấm Chữa &amp; Khắc Phục Lỗ Hổng</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Nhận kết quả phân tích tức thì, xem chi tiết đáp án từng bước và làm lại các câu sai để nhớ sâu kiến thức.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-bold text-slate-900">Câu Hỏi Thường Gặp</h3>
              <p className="text-sm text-slate-500 mt-2">
                Giải đáp những thắc mắc phổ biến về việc học tập và sử dụng nền tảng toan6789.vn
              </p>
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
        </section>

        {/* Final CTA Banner */}
        <section className="py-16 sm:py-24 bg-primary text-white relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Bắt Đầu Hành Trình Chinh Phục Điểm 9+ Môn Toán
            </h2>
            <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
              Trải nghiệm học tập thông minh cùng toan6789.vn ngay hôm nay để nắm vững kiến thức và tự tin đạt điểm cao.
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

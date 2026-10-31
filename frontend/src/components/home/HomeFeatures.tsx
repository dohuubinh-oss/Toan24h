'use client'

import React from 'react'
import Link from 'next/link'
import { BrainCircuit, Gamepad2, BookOpen, ArrowRight, Lightbulb, Sparkles, CheckCircle2 } from 'lucide-react'
import MathText from '@/components/ui/MathText'

export default function HomeFeatures() {
  return (
    <section className="py-24 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Linh hồn Toán học thực chiến
          </div>
          <h2 className="text-4xl font-bold mb-4 text-slate-900">Tại sao chọn chúng tôi?</h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Chúng tôi kết hợp trí tuệ nhân tạo MathAI với tư duy sư phạm chuẩn Bộ GD&ĐT từ Lớp 5 đến Lớp 9, giúp học sinh hiểu sâu bản chất thay vì học vẹt.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1: Đại số & Trợ lý MathAI từng bước */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-primary/40 hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Gia sư AI 24/7</h3>
                    <p className="text-xs text-slate-500">Phân tích bản chất đại số</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Đại số 8-9
                </span>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Giải đáp thắc mắc ngay lập tức, hướng dẫn từng bước chi tiết giúp học sinh hiểu bản chất vấn đề thay vì chỉ chép lời giải.
              </p>

              {/* Math Demonstration Box: KaTeX Algebra */}
              <div className="my-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold border-b border-slate-200/60 pb-2">
                  <span>Phương trình bậc 2</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn THCS
                  </span>
                </div>
                <div className="text-slate-900 font-medium py-0.5 text-sm">
                  <MathText content="Giải phương trình: $x^2 - 5x + 6 = 0$" />
                </div>
                <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-700 space-y-1.5">
                  <div className="text-primary font-bold flex items-center gap-1">
                    <span>⚡ Bước giải MathAI:</span>
                  </div>
                  <div className="text-slate-800 font-medium">
                    <MathText content="$\Leftrightarrow (x - 2)(x - 3) = 0 \implies x_1 = 2,\ x_2 = 3$" />
                  </div>
                  <div className="text-slate-600 text-xs pt-1 flex items-start gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>Hệ thức Viète: $x_1+x_2=5$ và $x_1 \cdot x_2=6$.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link 
                href="/lectures" 
                className="inline-flex items-center gap-2 text-primary font-bold text-sm group min-h-[44px] cursor-pointer hover:underline"
              >
                <span>Khám phá bài giảng Đại số</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 2: Hình học trực quan & Trực quan hóa SVG */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-primary/40 hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-xs">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Học tập Game hóa</h3>
                    <p className="text-xs text-slate-500">Hình học trực quan SVG</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Hình học 7-9
                </span>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Hệ thống Streak, điểm thưởng và bài giảng hình học trực quan giúp học sinh duy trì động lực học tập mỗi ngày mà không thấy nhàm chán.
              </p>

              {/* Math Demonstration Box: SVG Geometry Diagram */}
              <div className="my-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold border-b border-slate-200/60 pb-2">
                  <span>Hệ thức lượng trong tam giác vuông</span>
                  <span className="text-amber-700 font-bold">Hình vẽ SVG</span>
                </div>
                <div className="flex items-center justify-center py-1">
                  <svg viewBox="0 0 200 90" className="w-48 h-20 overflow-visible text-slate-700" stroke="currentColor" fill="none">
                    {/* Right-angled triangle ABC at A(50, 10), B(10, 80), C(190, 80) */}
                    <polygon points="50,10 10,80 190,80" stroke="#2563eb" strokeWidth="2" fill="rgba(37,99,235,0.05)" />
                    {/* Altitude AH */}
                    <line x1="50" y1="10" x2="50" y2="80" stroke="#d97706" strokeWidth="1.5" strokeDasharray="3,3" />
                    {/* Right angle marker at A */}
                    <path d="M 43,22 L 55,29 L 62,17" stroke="#2563eb" strokeWidth="1.2" fill="none" />
                    {/* Right angle marker at H */}
                    <rect x="50" y="72" width="8" height="8" stroke="#d97706" strokeWidth="1" fill="none" />
                    {/* Vertex labels */}
                    <text x="50" y="5" fontSize="10" fontWeight="bold" fill="#0f172a" textAnchor="middle">A</text>
                    <text x="3" y="86" fontSize="10" fontWeight="bold" fill="#0f172a">B</text>
                    <text x="195" y="86" fontSize="10" fontWeight="bold" fill="#0f172a">C</text>
                    <text x="50" y="91" fontSize="9" fontWeight="bold" fill="#b45309" textAnchor="middle">H</text>
                  </svg>
                </div>
                <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-800 text-center font-medium">
                  <MathText content="$AH^2 = BH \cdot CH \quad\text{và}\quad BC^2 = AB^2 + AC^2$" />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link 
                href="/student" 
                className="inline-flex items-center gap-2 text-primary font-bold text-sm group min-h-[44px] cursor-pointer hover:underline"
              >
                <span>Xem bảng xếp hạng & bài tập</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 3: Kho đề thi chuẩn ma trận Lớp 5 - 9 */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-primary/40 hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-primary flex items-center justify-center shrink-0 shadow-xs">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Bám sát lộ trình Bộ GD</h3>
                    <p className="text-xs text-slate-500">Chuẩn ma trận Lớp 5 - 9</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Lớp 5 - 9
                </span>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Kho đề thi, bài tập và kiến thức trọng tâm được cập nhật liên tục theo chuẩn khung chương trình giáo dục phổ thông mới.
              </p>

              {/* Math Demonstration Box: Grade 5 to 6 transition problem */}
              <div className="my-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold border-b border-slate-200/60 pb-2">
                  <span>Quy luật phân số (Toán Lớp 5)</span>
                  <span className="text-primary font-bold">Ôn thi vào 6 CLC</span>
                </div>
                <div className="text-slate-900 font-medium py-0.5 text-xs sm:text-sm">
                  <MathText content="Tính nhanh: $S = \frac{1}{1 \times 2} + \frac{1}{2 \times 3} + \dots + \frac{1}{99 \times 100}$" />
                </div>
                <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-700 space-y-1.5">
                  <div className="text-emerald-700 font-bold flex items-center gap-1">
                    <span>🎯 Phương pháp tách phân số:</span>
                  </div>
                  <div className="text-slate-800 font-medium">
                    <MathText content="$S = 1 - \frac{1}{100} = \frac{99}{100}$" />
                  </div>
                  <div className="text-slate-600 text-xs pt-1 flex items-start gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>Bài toán phân loại đề thi Amsterdam, Cầu Giấy.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link 
                href="/exams" 
                className="inline-flex items-center gap-2 text-primary font-bold text-sm group min-h-[44px] cursor-pointer hover:underline"
              >
                <span>Xem kho tài liệu & đề thi</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

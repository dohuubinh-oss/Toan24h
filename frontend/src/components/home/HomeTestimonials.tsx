import React from 'react'
import Image from 'next/image'
import { Star, CheckCircle2 } from 'lucide-react'

interface Testimonial {
  id: string
  name: string
  role: string
  achievement: string
  badgeColor: string
  quote: string
  avatarUrl: string
  avatarText: string
  location: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 'hoang-nam',
    name: 'Hoàng Nam',
    role: 'Học sinh Lớp 9',
    achievement: '9.25 điểm Toán vào 10 • Đỗ Chuyên Sư Phạm Hà Nội',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=160',
    avatarText: 'HN',
    location: 'Hà Nội',
    quote:
      'Phòng thi bấm giờ và bài giải chi tiết từng bước giúp em làm chủ phương pháp giải câu hình.',
  },
  {
    id: 'mai-huong',
    name: 'Chị Mai Hương',
    role: 'Phụ huynh bé Tuấn Kiệt (Lớp 7)',
    achievement: 'Báo cáo Telegram tức thì • Điểm số 6.0 ➔ 8.5',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=160',
    avatarText: 'MH',
    location: 'TP. Hồ Chí Minh',
    quote:
      'Tính năng Báo cáo Telegram rất tiện lợi. Tôi luôn nắm rõ tiến độ học và các dạng toán con làm sai mỗi ngày mà không cần phải thúc giục hay gây áp lực.',
  },
  {
    id: 'minh-chau',
    name: 'Lê Minh Châu',
    role: 'Học sinh Lớp 5',
    achievement: 'Đỗ Lớp 6 CLC Cầu Giấy • Tự tin làm chủ Toán tư duy',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=160',
    avatarText: 'MC',
    location: 'Cầu Giấy, Hà Nội',
    quote:
      'Các bài giảng phân số quy luật và hình học trực quan rất dễ hiểu, giúp em tự tin bứt phá điểm số và đỗ vào lớp 6 CLC Cầu Giấy.',
  },
]

export default function HomeTestimonials() {
  return (
    <section className="py-16 sm:py-24 bg-slate-50/70 border-t border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading - No eyebrow ban */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Đồng hành cùng hơn 12.000 học sinh bứt phá điểm số
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Những chia sẻ thực tế từ học sinh và phụ huynh đã tin tưởng toan6789.vn trên hành trình bứt phá điểm số môn Toán.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-blue-200 transition-all duration-300"
            >
              <div className="space-y-4">
                {/* Rating & Location */}
                <div className="flex items-center justify-between gap-2">
                  <div
                    className="flex items-center gap-1 text-amber-400"
                    aria-label="Đánh giá 5/5 sao"
                  >
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{item.location}</span>
                </div>

                {/* Achievement Badge */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${item.badgeColor}`}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.achievement}</span>
                </div>

                {/* Short, punchy quote */}
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed pt-1">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              {/* Author Info with Photo */}
              <div className="flex items-center gap-3 pt-6 mt-6 border-t border-slate-100">
                <div className="relative w-11 h-11 rounded-2xl overflow-hidden ring-2 ring-slate-100 bg-blue-50 shrink-0">
                  <Image
                    src={item.avatarUrl}
                    alt={`Ảnh đại diện của ${item.name}`}
                    width={44}
                    height={44}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {item.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

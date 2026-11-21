'use client'

import React, { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'single-grade',
    question: 'Tại sao mỗi tài khoản lại chỉ giới hạn trong một khối lớp đăng ký?',
    answer:
      'Để cá nhân hóa lộ trình học và hệ thống bài tập bám sát đúng chương trình GDPT của từng khối lớp. Thuật toán gợi ý đề thi và phân tích năng lực của toan6789.vn được tối ưu chuyên biệt theo chuẩn kiến thức riêng của từng lớp (Lớp 5, 6, 7, 8 hoặc 9), giúp học sinh tập trung tối đa mà không bị xao nhãng hay học vượt cấp thiếu khoa học.',
  },
  {
    id: 'telegram-bot',
    question: 'Làm thế nào để phụ huynh nhận được thông báo học tập qua Telegram?',
    answer:
      'Sau khi đăng ký tài khoản, phụ huynh chỉ cần quét mã QR trong mục Hồ sơ để liên kết với Telegram Bot của toan6789.vn. Ngay khi học sinh hoàn thành bất kỳ bài thi hay chuyên đề nào, bot sẽ tự động gửi báo cáo điểm số chi tiết, thời gian làm bài và phân tích các dạng toán con còn yếu trực tiếp về điện thoại của phụ huynh.',
  },
  {
    id: 'refund-policy',
    question: 'Chính sách cam kết hoàn tiền trong 7 ngày hoạt động như thế nào?',
    answer:
      'Chúng tôi cam kết chất lượng 100%. Nếu trong vòng 7 ngày đầu tiên kể từ lúc kích hoạt gói học, học sinh cảm thấy phương pháp học không phù hợp, phụ huynh chỉ cần liên hệ Hotline hoặc email support@toan6789.vn để được hoàn lại toàn bộ 100% học phí nhanh chóng mà không cần thủ tục phức tạp.',
  },
  {
    id: 'vietqr-auto',
    question: 'Phương thức thanh toán VietQR Napas có kích hoạt tự động không?',
    answer:
      'Có. Hệ thống tích hợp cổng thanh toán chuẩn VietQR kết nối liên ngân hàng Napas247, MB Bank, Vietcombank, Techcombank, MoMo. Sau khi quét mã QR chuyển khoản thành công, hệ thống nhận diện tức thì và tự động kích hoạt gói học trong vòng 3 đến 5 giây mà không cần người dùng phải chụp ảnh biên lai gửi duyệt thủ công.',
  },
]

export default function HomeFAQ() {
  const [openId, setOpenId] = useState<string | null>(null)

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading - Direct, no eyebrow ban */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Câu hỏi thường gặp của phụ huynh &amp; học sinh
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Giải đáp nhanh chóng các băn khoăn về quyền lợi khóa học, phương thức thanh toán và cách đồng hành cùng con.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openId === item.id
            return (
              <div
                key={item.id}
                className="border border-slate-200/90 rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-300"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                  className="w-full text-left px-5 sm:px-6 py-4 sm:py-5 min-h-[52px] flex items-center justify-between gap-4 bg-white hover:bg-slate-50/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                >
                  <span className="font-bold text-slate-900 text-sm sm:text-base pr-2">
                    {item.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-blue-50 text-primary' : 'text-slate-500'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${item.id}`}
                    className="px-5 sm:px-6 pb-5 pt-1 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100 bg-slate-50/40"
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

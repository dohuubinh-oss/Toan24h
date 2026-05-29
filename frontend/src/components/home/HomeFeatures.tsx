import React from 'react'
import { BrainCircuit, Gamepad2, BookOpen, ArrowRight } from 'lucide-react'

export default function HomeFeatures() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold mb-6 text-slate-900">Tại sao chọn chúng tôi?</h2>
          <p className="text-lg text-slate-500">
            Chúng tôi kết hợp công nghệ AI hàng đầu và phương pháp gamification để biến việc học Toán thành một hành trình thú vị.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 rounded-[20px] bg-slate-50 border border-slate-100 shadow-[0_10px_30px_-10px_rgba(37,99,235,0.12)] hover:-translate-y-2 transition-transform">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <BrainCircuit className="text-primary w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-slate-900">Gia sư AI 24/7</h3>
            <p className="text-slate-500 leading-relaxed mb-6">
              Giải đáp thắc mắc ngay lập tức, hướng dẫn từng bước chi tiết giúp học sinh hiểu bản chất vấn đề thay vì chỉ chép lời giải.
            </p>
            <div className="flex items-center gap-2 text-primary font-bold cursor-pointer group">
              <span>Khám phá ngay</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div className="p-8 rounded-[20px] bg-slate-50 border border-slate-100 shadow-[0_10px_30px_-10px_rgba(37,99,235,0.12)] hover:-translate-y-2 transition-transform">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-6">
              <Gamepad2 className="text-orange-500 w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-slate-900">Học tập Game hóa</h3>
            <p className="text-slate-500 leading-relaxed mb-6">
              Hệ thống Streak, điểm thưởng và bảng xếp hạng giúp học sinh duy trì động lực học tập mỗi ngày mà không thấy nhàm chán.
            </p>
            <div className="flex items-center gap-2 text-primary font-bold cursor-pointer group">
              <span>Xem bảng xếp hạng</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div className="p-8 rounded-[20px] bg-slate-50 border border-slate-100 shadow-[0_10px_30px_-10px_rgba(37,99,235,0.12)] hover:-translate-y-2 transition-transform">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
              <BookOpen className="text-primary w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-slate-900">Bám sát lộ trình Bộ GD</h3>
            <p className="text-slate-500 leading-relaxed mb-6">
              Kho đề thi, bài tập và kiến thức trọng tâm được cập nhật liên tục theo chuẩn khung chương trình giáo dục phổ thông mới.
            </p>
            <div className="flex items-center gap-2 text-primary font-bold cursor-pointer group">
              <span>Xem kho tài liệu</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

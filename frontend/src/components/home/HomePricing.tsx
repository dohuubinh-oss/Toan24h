import React from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

export default function HomePricing() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold mb-6 text-slate-900">Lựa chọn gói học phù hợp</h2>
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className="text-sm font-bold text-slate-400 uppercase">Hàng tháng</span>
            <button className="w-14 h-7 bg-primary/20 rounded-full relative p-1 flex items-center">
              <div className="w-5 h-5 bg-primary rounded-full translate-x-7"></div>
            </button>
            <span className="text-sm font-bold uppercase text-slate-900">
              Hàng năm <span className="text-primary">(Tiết kiệm 20%)</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Basic Plan */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col h-full">
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2 text-slate-900">Gói Cơ Bản</h3>
              <p className="text-slate-500">Khám phá phương pháp học AI</p>
            </div>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-5xl font-bold text-slate-900">0đ</span>
              <span className="text-slate-500">/tháng</span>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-primary w-5 h-5" />
                <span className="text-slate-700">Học liệu chuẩn lớp 6-12</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-primary w-5 h-5" />
                <span className="text-slate-700">5 câu hỏi AI mỗi ngày</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-primary w-5 h-5" />
                <span className="text-slate-700">Tham gia bảng xếp hạng</span>
              </li>
              <li className="flex items-center gap-3 opacity-40">
                <XCircle className="text-slate-400 w-5 h-5" />
                <span className="line-through text-slate-500">Lộ trình học cá nhân hóa</span>
              </li>
            </ul>
            <button className="w-full py-4 rounded-xl border-2 border-slate-200 font-bold hover:bg-primary hover:text-white hover:border-primary transition-all text-slate-700">
              Đăng ký ngay
            </button>
          </div>

          {/* Gói Pro */}
          <div className="relative bg-white p-10 rounded-[2rem] border-2 border-primary shadow-[0_10px_30px_-10px_rgba(37,99,235,0.12)] flex flex-col h-full">
            <div className="absolute -top-4 right-8 bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase">
              Được chọn nhiều nhất
            </div>
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2 text-slate-900">Gói Pro</h3>
              <p className="text-slate-500">Tối ưu điểm số cùng chuyên gia AI</p>
            </div>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-5xl font-bold text-slate-900">199k</span>
              <span className="text-slate-500">/tháng</span>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-primary w-5 h-5" />
                <span className="font-bold text-slate-900">Không giới hạn hỏi đáp AI</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-primary w-5 h-5" />
                <span className="text-slate-700">Lộ trình học cá nhân hóa</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-primary w-5 h-5" />
                <span className="text-slate-700">Kho 100,000+ đề thi có lời giải</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-primary w-5 h-5" />
                <span className="text-slate-700">Phân tích điểm mạnh/yếu 24/7</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-primary w-5 h-5" />
                <span className="text-slate-700">Hỗ trợ 1:1 qua hotline VIP</span>
              </li>
            </ul>
            <button className="w-full py-4 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">
              Nâng cấp Pro ngay
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

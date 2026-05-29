import React from 'react'
import { ArrowRight, Flame, Bell, Sparkles, TrendingUp } from 'lucide-react'

export default function HomeHero() {
  return (
    <section className="relative pt-12 pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-sm font-bold text-primary uppercase tracking-wider">AI-Powered Math Tutoring</span>
          </div>
          <h1 className="text-6xl lg:text-7xl font-bold leading-tight mb-6 text-slate-900">
            Học Toán không còn khó với <span className="text-primary italic">trợ lý AI</span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-lg">
            Chương trình chuẩn Bộ Giáo dục từ lớp 6-12. Cá nhân hóa lộ trình học tập, giúp bạn tiến bộ vượt bậc chỉ sau 30 ngày.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <button className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-xl shadow-primary/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
              Bắt đầu miễn phí <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 bg-white rounded-xl font-bold text-lg border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-slate-800">
              Xem demo
            </button>
          </div>
          
          <div className="flex items-center gap-4 py-6 border-t border-slate-200">
            <div className="flex -space-x-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Student 1" className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkg2j1eQxe8m9S3Yhptdh96e6OUu_RZ-rwmBhDF5piZGVUws4S2-y8OF4EikVbhklBkU9IB6_9GrPb1F8AOblKwxq1FGUtKjOydvTMfYkLsYVL5Ape6mJ27plYyHP47fJpwLrAgtbxy-AcoLBDCdh8xGSsrd7xTjlV0zcF9QaEaTtotCSe8Cy5J_XO3WCCTnMNKNQVrXIEsl5uhPYsnSmcVzYxjUjCdwkDZNfXOkSV9HTD8QvdaxO63ZhfE0ZV4GcHm8pxX3tMEMZm"/>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Student 2" className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLLhO8u-iBzfHpy648Tt1cNuk7COYKl_yWeI7H15Y31w-DcTYEKRakeXWZPldOxjwFG6-H0FYqimLhGecYjcHLbxvGP1fnwbrHHM45u-7WeBDYBckxr5GSkWUFxLoS7nzWogEP1Ni45cd8_g-alCnQuUDJ6EnB7uPUZkEFT3h1qj10GKXTuylWvrQPEwIuX-g13g_x2YffKW2IwtKt2rI3gPnTIvbqOiTERMeO10H7Rb429QwrhIm1DlRzauvGXW037bu7r-dOYBMn"/>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Student 3" className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnYWjVSOz64s5rTjt6fGCdrHutCZKy1q7_5jx4c49sXHt8goVaMj6OWXpUwi6ZuHKiJ8QNHjRXAE0DB-NPoGp7rEkKoKmOuhufMb2fWjFXhJ5gFQR53hxiFRuL-GwXxaSVTkQqWaiqmF4_vZbFw0ioWqKnNkQZNkClbgxO3q61rU1zMOUxTlC725DMg8pmvOf5yWd0XAin_obayiDvbShW1z7kIr49gWci08wSSe4ScepETs6bRMDNJCIGGbj5KdTYxKrLty62xdsg"/>
              <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-600">+100k</div>
            </div>
            <p className="text-sm font-medium text-slate-500">100,000+ Học sinh tin dùng trên toàn quốc</p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-50"></div>
          <div className="relative bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-[0_10px_30px_-10px_rgba(37,99,235,0.12)] border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Chào Minh! 👋</h3>
                <p className="text-sm text-slate-500">Tiếp tục giải đề Toán 12</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1 bg-orange-100 px-3 py-1 rounded-full text-orange-600 font-bold">
                  <Flame className="w-4 h-4" />
                  <span>12</span>
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-slate-600" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <p className="text-xs font-bold text-primary uppercase mb-1">Tiến độ tuần</p>
                <p className="text-2xl font-bold text-slate-900">85%</p>
                <div className="w-full bg-primary/10 h-1.5 rounded-full mt-2">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Huy hiệu</p>
                <div className="flex gap-2">
                  <div className="text-yellow-500">🏆</div>
                  <div className="text-blue-500">✅</div>
                  <div className="text-primary">🧠</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold">Trợ lý MathAI</span>
              </div>
              <div className="space-y-3">
                <div className="bg-white/10 rounded-xl p-3 text-xs leading-relaxed">
                  "Chào bạn! Tôi thấy bạn đang gặp khó ở phần **Tích phân**. Bạn có muốn tôi hướng dẫn cách giải phương pháp từng phần không?"
                </div>
                <div className="flex gap-2">
                  <div className="px-3 py-2 bg-primary text-xs font-bold rounded-lg cursor-pointer hover:bg-primary/90 transition-colors">Giải ngay</div>
                  <div className="px-3 py-2 bg-white/5 text-xs font-bold rounded-lg cursor-pointer hover:bg-white/10 transition-colors">Để sau</div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-3 z-20">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-primary font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Tăng 2.5 điểm</p>
              <p className="text-[10px] text-slate-500">Trung bình sau 2 tuần</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

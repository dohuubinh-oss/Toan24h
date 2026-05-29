import React from 'react'
import { Brain, Flame, Award, Timer } from 'lucide-react'

export default function StudentAchievements() {
  return (
    <section className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800">Thành tích</h3>
        <a className="text-primary text-sm font-semibold hover:underline" href="#">Tất cả</a>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {/* Logic Master */}
        <div className="flex flex-col items-center p-4 bg-primary/5 rounded-xl border border-primary/10 text-center group cursor-pointer shadow-[0_0_15px_-3px_rgba(37,99,235,0.2)]">
          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Brain className="text-primary" size={24} />
          </div>
          <p className="text-[11px] font-bold text-primary uppercase mb-1">Logic Master</p>
          <p className="text-[10px] text-slate-500">Giải 50 bài đố</p>
        </div>

        {/* 100 Streak */}
        <div className="flex flex-col items-center p-4 bg-orange-50 rounded-xl border border-orange-100 text-center group cursor-pointer">
          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Flame className="text-orange-500" size={24} />
          </div>
          <p className="text-[11px] font-bold text-orange-600 uppercase mb-1">100 Streak</p>
          <p className="text-[10px] text-slate-500">Chăm chỉ 100 ngày</p>
        </div>

        {/* Vô địch */}
        <div className="flex flex-col items-center p-4 border border-slate-100 bg-amber-50/50 rounded-xl group cursor-pointer shadow-[0_0_15px_-3px_rgba(252,211,77,0.4)]">
          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform border border-amber-300">
            <Award className="text-amber-600" size={24} />
          </div>
          <p className="text-[11px] font-bold text-amber-600 uppercase mb-1">Vô địch</p>
          <p className="text-[10px] text-slate-500">Đã mở khóa Pro</p>
        </div>

        {/* Siêu tốc */}
        <div className="flex flex-col items-center p-4 border border-dashed border-slate-200 rounded-xl opacity-50 grayscale">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2">
            <Timer className="text-slate-400" size={24} />
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">Siêu tốc</p>
          <p className="text-[10px] text-slate-500 italic">Đang khóa</p>
        </div>
      </div>
    </section>
  )
}

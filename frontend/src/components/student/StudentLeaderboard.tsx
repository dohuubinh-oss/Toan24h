import React from 'react'
import { Info, Trophy, Award } from 'lucide-react'

export default function StudentLeaderboard() {
  return (
    <section className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800">Bảng xếp hạng</h3>
        <Info className="text-slate-400 cursor-pointer hover:text-primary transition-colors" size={20} />
      </div>
      <div className="space-y-4">
        {/* Top 1 */}
        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
          <span className="font-bold text-amber-600 w-4 text-center">1</span>
          <div className="w-10 h-10 rounded-full bg-slate-200" />
          <div className="flex-1">
            <p className="font-bold text-sm">Minh Anh</p>
            <p className="text-xs text-slate-500">12,400 XP</p>
          </div>
          <Trophy className="text-amber-500" size={16} />
        </div>

        {/* Top 2 */}
        <div className="flex items-center gap-4 p-3 border border-transparent">
          <span className="font-bold text-slate-400 w-4 text-center">2</span>
          <div className="w-10 h-10 rounded-full bg-slate-200" />
          <div className="flex-1">
            <p className="font-bold text-sm">Hà Phương</p>
            <p className="text-xs text-slate-500">11,200 XP</p>
          </div>
        </div>

        {/* Current User */}
        <div className="flex items-center gap-4 p-3 bg-gradient-to-br from-blue-50 to-amber-50 border border-amber-200/50 rounded-xl shadow-[0_0_15px_-3px_rgba(252,211,77,0.4)]">
          <span className="font-bold text-primary w-4 text-center">4</span>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold border-2 border-white shadow-sm">N</div>
            <Award className="absolute -top-1 -right-1 text-amber-500 fill-amber-500" size={14} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <p className="font-bold text-sm">Bạn (Nam)</p>
              <span className="text-[8px] bg-amber-400 text-white px-1 rounded-sm font-black">PRO</span>
            </div>
            <p className="text-xs text-primary font-bold">2,450 XP</p>
          </div>
          <span className="text-[10px] font-bold text-white px-2 py-1 bg-primary rounded-md shadow-sm">BẠN</span>
        </div>
      </div>
      <button className="w-full mt-6 h-10 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
        Xem toàn bộ
      </button>
    </section>
  )
}

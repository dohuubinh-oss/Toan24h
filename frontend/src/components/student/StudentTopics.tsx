import React from 'react'
import { Ruler, Shapes, TrendingUp, ArrowRight } from 'lucide-react'

export default function StudentTopics() {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-800">Chủ đề toán học</h3>
        <a className="text-primary font-semibold text-sm hover:underline" href="#">Xem tất cả</a>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Ruler size={24} />
          </div>
          <h4 className="font-bold text-lg mb-1">Đại số</h4>
          <p className="text-sm text-slate-500 mb-4">12 Chương • 48 Bài học</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mb-4">
            <div className="bg-orange-500 h-full rounded-full" style={{ width: '40%' }}></div>
          </div>
          <button className="text-orange-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
            Tiếp tục <ArrowRight size={16} />
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Shapes size={24} />
          </div>
          <h4 className="font-bold text-lg mb-1">Hình học</h4>
          <p className="text-sm text-slate-500 mb-4">8 Chương • 32 Bài học</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mb-4">
            <div className="bg-green-500 h-full rounded-full" style={{ width: '15%' }}></div>
          </div>
          <button className="text-green-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
            Tiếp tục <ArrowRight size={16} />
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <TrendingUp size={24} />
          </div>
          <h4 className="font-bold text-lg mb-1">Giải tích</h4>
          <p className="text-sm text-slate-500 mb-4">6 Chương • 24 Bài học</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mb-4">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: '5%' }}></div>
          </div>
          <button className="text-purple-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
            Tiếp tục <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  )
}

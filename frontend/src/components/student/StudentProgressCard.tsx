import React from 'react'
import { ArrowRight, Calculator } from 'lucide-react'

export default function StudentProgressCard() {
  return (
    <section className="relative overflow-hidden bg-primary rounded-2xl p-8 text-white shadow-md">
      <div className="relative z-10 flex justify-between items-start">
        <div className="max-w-md">
          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest">Đang học tiếp</span>
          <h3 className="text-3xl font-bold mt-4 mb-2">Phương trình bậc hai</h3>
          <p className="text-white/80 mb-6">Bạn đã hoàn thành 65% chương này. Chỉ còn 2 bài học nữa là đạt huy hiệu mới!</p>
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Tiến độ chương</span>
              <span className="font-bold">65%</span>
            </div>
            <div 
              role="progressbar" 
              aria-valuenow={65} 
              aria-valuemin={0} 
              aria-valuemax={100}
              className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden"
            >
              <div className="bg-white h-full shadow-[0_0_10px_white]" style={{ width: '65%' }}></div>
            </div>
          </div>
          <button className="bg-white text-primary px-8 h-12 rounded-lg font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
            Học tiếp ngay <ArrowRight size={18} />
          </button>
        </div>
        <div className="hidden lg:block opacity-20">
          <Calculator size={120} />
        </div>
      </div>
      <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute -left-16 -top-16 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
    </section>
  )
}

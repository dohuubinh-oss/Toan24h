import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function UserPagination() {
  return (
    <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 p-6 pt-0">
      <p className="text-sm text-slate-500">
        Hiển thị <span className="font-semibold text-slate-700">1 - 5</span> trên tổng số <span className="font-semibold text-slate-700">1,248</span> người dùng
      </p>
      <div className="flex items-center gap-2">
        <button className="w-11 h-11 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-primary hover:border-primary transition-all disabled:opacity-50" disabled>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button className="w-11 h-11 flex items-center justify-center rounded-lg bg-primary text-white font-semibold transition-all">1</button>
        <button className="w-11 h-11 flex items-center justify-center rounded-lg border border-transparent text-slate-600 hover:bg-slate-200 transition-all font-semibold">2</button>
        <button className="w-11 h-11 flex items-center justify-center rounded-lg border border-transparent text-slate-600 hover:bg-slate-200 transition-all font-semibold">3</button>
        <span className="px-2 text-slate-400">...</span>
        <button className="w-11 h-11 flex items-center justify-center rounded-lg border border-transparent text-slate-600 hover:bg-slate-200 transition-all font-semibold">125</button>
        <button className="w-11 h-11 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-primary hover:border-primary transition-all">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

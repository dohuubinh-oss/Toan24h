import React from 'react'
import { Settings2, ChevronDown } from 'lucide-react'

export default function LectureBasicSettings() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <h3 className="font-bold flex items-center gap-2 text-ink">
          <Settings2 className="text-primary" size={20} />
          Cấu hình cơ bản
        </h3>
      </div>
      <div className="p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 ml-1">Tên bài giảng</label>
          <input 
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400 text-ink" 
            placeholder="Nhập tên bài giảng..." 
            type="text" 
            defaultValue="Khảo sát hàm số bậc 3"
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 ml-1">Danh mục</label>
          <div className="relative">
            <select className="w-full appearance-none px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer text-ink">
              <option value="daiso">Đại số & Giải tích</option>
              <option value="hinhhoc">Hình học</option>
              <option value="thongke">Xác suất thống kê</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 ml-1">Khối lớp</label>
          <div className="relative flex flex-wrap gap-2">
             {/* Instead of select, maybe chips or a select. Let's stick to select to match tests exactly */}
             <select className="w-full appearance-none px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer text-ink" defaultValue="12">
              <option value="10">Lớp 10</option>
              <option value="11">Lớp 11</option>
              <option value="12">Lớp 12</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
          </div>
        </div>
      </div>
    </div>
  )
}

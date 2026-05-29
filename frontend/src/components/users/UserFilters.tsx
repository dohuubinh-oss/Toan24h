import React from 'react'
import { FilterX } from 'lucide-react'

export default function UserFilters() {
  return (
    <div className="flex flex-col space-y-8">
      {/* Role Filter */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Vai trò</h3>
        <div className="space-y-3">
          <label className="flex items-center group cursor-pointer">
            <input defaultChecked className="rounded border-slate-300 text-primary focus:ring-primary bg-transparent w-4 h-4" type="checkbox" />
            <span className="ml-3 text-sm text-slate-600 group-hover:text-primary transition-colors">Tất cả vai trò</span>
          </label>
          <label className="flex items-center group cursor-pointer">
            <input className="rounded border-slate-300 text-primary focus:ring-primary bg-transparent w-4 h-4" type="checkbox" />
            <span className="ml-3 text-sm text-slate-600 group-hover:text-primary transition-colors">Học sinh</span>
          </label>
          <label className="flex items-center group cursor-pointer">
            <input className="rounded border-slate-300 text-primary focus:ring-primary bg-transparent w-4 h-4" type="checkbox" />
            <span className="ml-3 text-sm text-slate-600 group-hover:text-primary transition-colors">Giáo viên</span>
          </label>
          <label className="flex items-center group cursor-pointer">
            <input className="rounded border-slate-300 text-primary focus:ring-primary bg-transparent w-4 h-4" type="checkbox" />
            <span className="ml-3 text-sm text-slate-600 group-hover:text-primary transition-colors">Quản trị viên</span>
          </label>
        </div>
      </div>

      {/* Grade Filter */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Khối lớp</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center group cursor-pointer">
            <input className="rounded border-slate-300 text-primary focus:ring-primary bg-transparent w-4 h-4" type="checkbox" />
            <span className="ml-2 text-sm text-slate-600 group-hover:text-primary transition-colors">Lớp 1-5</span>
          </label>
          <label className="flex items-center group cursor-pointer">
            <input className="rounded border-slate-300 text-primary focus:ring-primary bg-transparent w-4 h-4" type="checkbox" />
            <span className="ml-2 text-sm text-slate-600 group-hover:text-primary transition-colors">Lớp 6-9</span>
          </label>
          <label className="flex items-center group cursor-pointer">
            <input defaultChecked className="rounded border-slate-300 text-primary focus:ring-primary bg-transparent w-4 h-4" type="checkbox" />
            <span className="ml-2 text-sm text-slate-600 group-hover:text-primary transition-colors">Lớp 10</span>
          </label>
          <label className="flex items-center group cursor-pointer">
            <input className="rounded border-slate-300 text-primary focus:ring-primary bg-transparent w-4 h-4" type="checkbox" />
            <span className="ml-2 text-sm text-slate-600 group-hover:text-primary transition-colors">Lớp 11</span>
          </label>
          <label className="flex items-center group cursor-pointer">
            <input className="rounded border-slate-300 text-primary focus:ring-primary bg-transparent w-4 h-4" type="checkbox" />
            <span className="ml-2 text-sm text-slate-600 group-hover:text-primary transition-colors">Lớp 12</span>
          </label>
        </div>
      </div>

      {/* Reset Filters */}
      <button className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors border border-dashed border-slate-300 rounded-lg">
        <FilterX className="w-5 h-5" />
        Xóa bộ lọc
      </button>
    </div>
  )
}

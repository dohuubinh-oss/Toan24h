import React from 'react'
import { Search, Plus, ChevronRight } from 'lucide-react'

export default function UserHeader() {
  return (
    <header className="bg-white border-b border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10">
      <div>
        <nav className="flex text-xs text-slate-500 mb-1 gap-2 items-center">
          <a className="hover:text-primary" href="#">Trang chủ</a>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-400">Quản lý người dùng</span>
        </nav>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý người dùng</h2>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-primary transition-colors" />
          <input 
            className="pl-10 pr-4 h-12 bg-slate-100 border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm w-full md:w-80 transition-all outline-none" 
            placeholder="Tìm kiếm theo tên, email..." 
            type="text" 
          />
        </div>
        <button className="bg-primary hover:bg-blue-700 text-white px-6 h-12 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all shadow-lg shadow-primary/25 whitespace-nowrap">
          <Plus className="w-5 h-5" />
          Thêm người dùng mới
        </button>
      </div>
    </header>
  )
}

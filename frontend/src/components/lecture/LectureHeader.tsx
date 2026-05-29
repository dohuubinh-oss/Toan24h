import React from 'react'
import { ChevronRight, Calendar, Bookmark, Tags } from 'lucide-react'

export default function LectureHeader() {
  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 overflow-x-auto whitespace-nowrap">
        <a className="hover:text-primary transition-colors" href="#">Trang chủ</a>
        <ChevronRight size={16} />
        <a className="hover:text-primary transition-colors" href="#">Hình học lớp 12</a>
        <ChevronRight size={16} />
        <span className="text-ink font-medium">Thể tích khối chóp</span>
      </nav>

      {/* Article Header */}
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-ink leading-tight">
          Chuyên đề: Thể tích khối chóp và các bài toán thực tế nâng cao
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div 
              className="size-6 rounded-full bg-slate-200" 
              style={{
                backgroundImage: "url('https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher')",
                backgroundSize: 'cover'
              }}
            ></div>
            <span className="font-semibold text-slate-700">Thầy Nguyễn Văn A</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Calendar size={16} />
            <span>15 Tháng 5, 2024</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
            <Tags size={16} />
            <span>Hình học lớp 12</span>
          </div>
        </div>
      </div>
    </div>
  )
}

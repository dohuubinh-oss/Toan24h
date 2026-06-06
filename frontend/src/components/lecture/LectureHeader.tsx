'use client'
import React, { useState } from 'react'
import { ChevronRight, Calendar, Bookmark, Tags } from 'lucide-react'

interface LectureHeaderProps {
  initialBookmarked?: boolean;
}

export default function LectureHeader({ initialBookmarked = false }: LectureHeaderProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);

  const toggleBookmark = () => {
    // In the future, this is where you'd call an API to save to the database
    setIsBookmarked(!isBookmarked);
  };

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
        <div className="flex flex-wrap items-center justify-between gap-4">
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
          
          <button 
            onClick={toggleBookmark}
            className={`flex items-center justify-center gap-2 px-4 py-2 font-bold rounded-lg transition-all border text-sm ${
              isBookmarked 
                ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' 
                : 'bg-slate-100 text-ink border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Bookmark 
              size={18} 
              className={isBookmarked ? 'fill-amber-500 text-amber-500' : ''} 
            />
            {isBookmarked ? 'Đã lưu' : 'Lưu bài viết'}
          </button>
        </div>
      </div>
    </div>
  )
}

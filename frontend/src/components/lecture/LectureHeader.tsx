'use client'
import React, { useState, useEffect } from 'react'
import { ChevronRight, Calendar, Bookmark, Tags, PenTool } from 'lucide-react'
import Link from 'next/link'
import { toggleBookmark as toggleBookmarkApi, getBookmarkedLectures } from '@/lib/bookmarkApi'
import { toast } from '@/components/ui/ToastProvider'

interface LectureHeaderProps {
  initialBookmarked?: boolean;
  title: string;
  grade: string;
  category: string;
  createdAt: string;
  id?: string;
}

export default function LectureHeader({ initialBookmarked = false, title, grade, category, createdAt, id }: LectureHeaderProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (id && typeof window !== 'undefined' && document.cookie.includes('userRole=')) {
      getBookmarkedLectures().then(bookmarks => {
        const found = bookmarks.some((b: any) => b.lectureId === id)
        setIsBookmarked(found)
      }).catch(err => console.error("Failed to fetch bookmarks:", err))
    }
  }, [id])

  const toggleBookmark = async () => {
    if (!id) return;
    if (typeof window !== 'undefined' && !document.cookie.includes('userRole=')) {
      toast.error("Vui lòng đăng nhập để lưu bài viết.")
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await toggleBookmarkApi(id);
      if (res.is_bookmarked) {
        setIsBookmarked(true);
      } else {
        setIsBookmarked(false);
      }
    } catch (error) {
      console.error("Failed to toggle bookmark", error);
      toast.error("Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 overflow-x-auto whitespace-nowrap">
        <a className="hover:text-primary transition-colors" href="#">Trang chủ</a>
        <ChevronRight size={16} />
        <a className="hover:text-primary transition-colors" href="#">{category}</a>
        <ChevronRight size={16} />
        <span className="text-ink font-medium">{title}</span>
      </nav>

      {/* Article Header */}
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-ink leading-tight pl-8">
          {title}
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
              <span>{new Date(createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
              <Tags size={16} />
              <span>{category} - Khối {grade}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {id && (
              <Link 
                href={`/practices/lop/${grade}?lecture=${id}&lectureName=${encodeURIComponent(title)}`}
                className="flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] font-bold rounded-lg transition-all border text-sm bg-primary text-white hover:bg-primary/90 border-transparent shadow-sm"
              >
                <PenTool size={18} />
                Luyện tập
              </Link>
            )}
            <button 
              onClick={toggleBookmark}
              disabled={isLoading}
              className={`flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] font-bold rounded-lg transition-all border text-sm ${
                isBookmarked 
                  ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' 
                  : 'bg-slate-100 text-ink border-slate-200 hover:bg-slate-200'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
    </div>
  )
}

import React from 'react'
import { Sparkles, FileText, Upload, Settings } from 'lucide-react'

export default function LectureCreatorHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 px-4 md:px-8 py-3">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-lg text-primary flex items-center justify-center">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-ink">Soạn bài giảng mới</h1>
            <p className="text-xs text-slate-500">Môn Toán học • Trạng thái: Đang soạn thảo</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-ink rounded-lg text-sm font-semibold transition-colors h-12">
            <FileText size={20} />
            Tải file PDF đính kèm
          </button>
          
          <button className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors h-12">
            <Upload size={20} />
            Lưu & Xuất bản
          </button>
          
          <button className="p-2 text-slate-400 hover:text-ink w-12 h-12 flex items-center justify-center">
            <Settings size={24} />
          </button>
        </div>
      </div>
    </header>
  )
}

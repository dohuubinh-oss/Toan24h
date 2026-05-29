import React from 'react'
import { Sparkles, FileText, UploadCloud, Settings } from 'lucide-react'

interface ExamHeaderProps {
  title?: string
  subtitle?: string
}

export default function ExamHeader({ 
  title = "Kiểm tra & Hoàn thiện đề thi AI",
  subtitle = "Toán học THPT • Mã đề: AI-2024-MATH"
}: ExamHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 px-4 md:px-8 py-3">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">{title}</h1>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="hidden md:flex items-center justify-center gap-2 px-4 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors">
            <FileText className="w-5 h-5" />
            Tải file PDF
          </button>
          <button className="flex items-center justify-center gap-2 px-5 h-12 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors">
            <UploadCloud className="w-5 h-5" />
            Lưu & Xuất bản
          </button>
          <button className="p-2 w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  )
}

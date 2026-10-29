import React from 'react'
import { UploadCloud, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '../ui/Button'

interface ExamHeaderProps {
  title?: string
  subject?: string
  examCode?: string
  onSave?: () => void
  isSaving?: boolean
}

export default function ExamHeader({ 
  title = "Kiểm tra & Hoàn thiện đề thi",
  subject = "Toán học THCS",
  examCode = "",
  onSave,
  isSaving = false
}: ExamHeaderProps) {
  const subtitle = examCode ? `${subject} • Mã đề: ${examCode}` : subject;

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/exams" 
            aria-label="Quay lại danh sách đề thi"
            className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors text-slate-500 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold leading-tight">{title || 'Bài thực hành mới'}</h1>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={onSave}
            disabled={isSaving}
            className="h-12 min-h-[44px] px-5 rounded-xl text-xs sm:text-sm font-semibold gap-2 shadow-sm shadow-primary/20 cursor-pointer"
          >
            <UploadCloud className={`w-4 h-4 ${isSaving ? 'animate-bounce' : ''}`} />
            {isSaving ? 'Đang lưu...' : 'Lưu & Xuất bản'}
          </Button>
        </div>
      </div>
    </header>
  )
}

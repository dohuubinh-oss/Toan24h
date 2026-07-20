import React from 'react'
import { Sparkles, FileText, UploadCloud, Settings, ArrowLeft } from 'lucide-react'
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
          <Link href="/dashboard/exams" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold leading-tight">{title || 'Đề thi mới'}</h1>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="hidden md:flex h-12 rounded-lg text-sm font-semibold gap-2">
            <FileText className="w-5 h-5" />
            Tải file PDF
          </Button>
          <Button 
            onClick={onSave}
            disabled={isSaving}
            className="h-12 px-5 rounded-lg text-sm font-semibold gap-2 shadow-sm"
          >
            <UploadCloud className={`w-5 h-5 ${isSaving ? 'animate-bounce' : ''}`} />
            {isSaving ? 'Đang lưu...' : 'Lưu & Xuất bản'}
          </Button>

        </div>
      </div>
    </header>
  )
}

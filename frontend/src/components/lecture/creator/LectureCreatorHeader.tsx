'use client'
import React from 'react'
import { ArrowLeft, FileText, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useLectureCreator } from './LectureCreatorContext'

export default function LectureCreatorHeader() {
  const { validateAndSubmit, isSubmitting } = useLectureCreator()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 w-full">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-800">Soạn bài giảng mới</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="hidden md:flex items-center gap-2" disabled={isSubmitting}>
            <FileText className="w-4 h-4" />
            Tải file PDF đính kèm
          </Button>
          
          <Button 
            className="px-6 flex items-center gap-2 shadow-sm shadow-primary/20"
            onClick={validateAndSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Lưu & Xuất bản
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}

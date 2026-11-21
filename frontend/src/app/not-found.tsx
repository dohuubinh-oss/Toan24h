import React from 'react'
import Link from 'next/link'
import { FileQuestion, Home, BookOpen, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-blue-50 text-primary rounded-3xl mx-auto flex items-center justify-center shadow-xs border border-blue-100">
          <FileQuestion className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            404 - Không tìm thấy nội dung
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight pt-2">
            Bài giảng hoặc trang không tồn tại
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Nội dung này có thể đã được gỡ bỏ trong đợt làm mới dữ liệu bản quyền, hoặc đường dẫn không còn chính xác.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Trang chủ</span>
          </Link>
          <Link
            href="/student"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-all active:scale-95"
          >
            <BookOpen className="w-4 h-4" />
            <span>Khu vực học tập</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

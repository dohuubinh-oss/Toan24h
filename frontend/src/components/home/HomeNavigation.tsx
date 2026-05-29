import React from 'react'
import Link from 'next/link'
import { FunctionSquare } from 'lucide-react'

export default function HomeNavigation() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <FunctionSquare className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            Math<span className="text-primary">AI</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8 font-medium">
          <a className="hover:text-primary transition-colors text-slate-700" href="#">Tính năng</a>
          <a className="hover:text-primary transition-colors text-slate-700" href="#">Lộ trình</a>
          <a className="hover:text-primary transition-colors text-slate-700" href="#">Bảng giá</a>
          <a className="hover:text-primary transition-colors text-slate-700" href="#">Cộng đồng</a>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/login"
            className="px-6 py-2.5 rounded-full font-semibold border-2 border-slate-200 text-slate-700 hover:border-primary/30 hover:bg-primary/5 transition-all"
          >
            Đăng nhập
          </Link>
          <Link 
            href="/dashboard"
            className="px-6 py-2.5 rounded-full font-semibold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            Học ngay
          </Link>
        </div>
      </div>
    </nav>
  )
}

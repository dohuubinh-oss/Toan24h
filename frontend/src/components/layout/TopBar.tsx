'use client'

import React from 'react'
import { Sparkles, Upload, Plus } from 'lucide-react'
import { Button } from '../ui/Button'
import { useRouter } from 'next/navigation'

export default function TopBar() {
  const router = useRouter();
  return (
    <header className="w-full bg-white border-b border-slate-200 h-20 flex items-center justify-center shrink-0 sticky top-0 z-10">
      <div className="w-full max-w-7xl flex items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Sparkles className="w-6 h-6" />
          </div>
          
          {/* Title */}
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">Quản lý ngân hàng câu hỏi</h1>
            <p className="text-sm font-medium text-slate-500">Toán học THCS • Tổng số: 304 câu hỏi</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            className="gap-2 font-semibold"
            onClick={() => router.push('/dashboard/questions/create')}
          >
            <Upload className="w-4 h-4" />
            Nhập từ JSON
          </Button>
          <Button variant="primary" className="gap-2 font-semibold shadow-md shadow-primary/20">
            <Plus className="w-4 h-4" />
            Tạo đề thi
          </Button>
        </div>
      </div>
    </header>
  )
}

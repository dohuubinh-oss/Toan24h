import React from 'react'
import Link from 'next/link'
import { PenTool, Plus } from 'lucide-react'

export default function AdminTestsDashboard() {
  const grades = [
    { id: '5', name: 'Lớp 5' },
    { id: '6', name: 'Lớp 6' },
    { id: '7', name: 'Lớp 7' },
    { id: '8', name: 'Lớp 8' },
    { id: '9', name: 'Lớp 9' },
    { id: '10-chuyen', name: 'Luyện thi chuyên vào lớp 10' }
  ]

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">Quản lý đề thi theo khối lớp</h1>
            <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full border border-primary/20">
              Admin & Teacher Access
            </span>
          </div>
          <p className="text-slate-500 mt-1">Vui lòng chọn một khối lớp để xem danh sách đề thi.</p>
        </div>
        
        <Link 
          href="/dashboard/exams/create" 
          className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:scale-105"
        >
          <Plus size={20} />
          Tạo đề thi mới
        </Link>
      </div>

      {/* Grade Selector Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {grades.map((grade) => (
          <Link
            key={grade.id}
            href={`/exams/lop/${grade.id}`}
            className="group flex flex-col items-center justify-center bg-white border border-slate-200 p-8 rounded-2xl hover:border-primary hover:shadow-lg transition-all"
          >
            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <PenTool size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">{grade.name}</h3>
            <span className="text-sm font-semibold text-primary mt-2 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              Xem đề thi →
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

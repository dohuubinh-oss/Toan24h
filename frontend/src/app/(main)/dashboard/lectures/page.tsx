import React from 'react'
import Link from 'next/link'
import { BookOpen, Plus } from 'lucide-react'

export default function AdminLecturesDashboard() {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Quản lý bài giảng theo khối lớp</h1>
          <p className="text-slate-500 mt-2">Chọn một khối lớp để xem và quản lý danh sách bài giảng (Admin Access).</p>
        </div>
        
        <Link 
          href="/dashboard/lectures/create" 
          className="px-4 py-2 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          Tạo bài giảng
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {grades.map((grade) => (
          <Link
            key={grade.id}
            href={`/lectures/lop/${grade.id}`}
            className="group flex flex-col items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl hover:border-primary hover:shadow-lg transition-all"
          >
            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{grade.name}</h3>
            <span className="text-sm text-slate-500 mt-2">Xem danh sách →</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

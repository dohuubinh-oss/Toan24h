'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight, FileText, CheckCircle, TrendingUp, Search, Plus } from 'lucide-react'
import ExamTable, { Exam } from '../../../components/exams/ExamTable'

export default function ExamsPage() {
  const mockExams: Exam[] = [
    {
      id: 'E-01',
      title: 'Kiểm tra Giữa kỳ I - Đại số 10',
      grade: 10,
      questionCount: 50,
      duration: 90,
      status: 'Published',
      updatedAt: '2 giờ trước'
    },
    {
      id: 'E-02',
      title: 'Ôn tập Hình học Giải tích',
      grade: 12,
      questionCount: 35,
      duration: 60,
      status: 'Draft',
      updatedAt: 'Hôm qua'
    },
    {
      id: 'E-03',
      title: 'Kiểm tra 15p - Đạo hàm',
      grade: 11,
      questionCount: 20,
      duration: 15,
      status: 'Ended',
      updatedAt: '3 ngày trước'
    }
  ]

  return (
    <div className="flex flex-1 overflow-hidden">
      <main className="flex-1 overflow-y-auto bg-page-bg p-6">
        <div className="flex flex-col gap-6 max-w-7xl mx-auto relative">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <span className="hover:text-primary cursor-pointer transition-colors">Trang chủ</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-primary font-bold">Kho lưu trữ đề thi</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Danh sách Bài thi</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
            <div className="card-premium flex items-center gap-4 !p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tổng số đề thi</p>
                <h3 className="text-2xl font-extrabold text-slate-900">156</h3>
              </div>
            </div>
            <div className="card-premium flex items-center gap-4 !p-6">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Đang hoạt động</p>
                <h3 className="text-2xl font-extrabold text-slate-900">84</h3>
              </div>
            </div>
            <div className="card-premium flex items-center gap-4 !p-6">
              <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center text-primary">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tổng lượt làm bài</p>
                <h3 className="text-2xl font-extrabold text-slate-900">5,420</h3>
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row items-center gap-3 flex-1">
              <div className="relative w-full md:w-80">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm" placeholder="Tìm kiếm tên đề thi..." type="text"/>
              </div>
              <select className="w-full md:w-40 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm text-slate-600">
                <option value="">Khối lớp</option>
                <option value="10">Lớp 10</option>
                <option value="11">Lớp 11</option>
                <option value="12">Lớp 12</option>
              </select>
              <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-lg">
                <button className="px-4 py-1.5 text-xs font-semibold rounded-md bg-white shadow-sm text-primary">Tất cả</button>
                <button className="px-4 py-1.5 text-xs font-semibold rounded-md text-slate-500 hover:text-primary transition-colors">Nháp</button>
                <button className="px-4 py-1.5 text-xs font-semibold rounded-md text-slate-500 hover:text-primary transition-colors">Đã xuất bản</button>
              </div>
            </div>
            <Link href="/dashboard/exams/create" className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5" />
              Tạo đề thi mới
            </Link>
          </div>

          <ExamTable exams={mockExams} />
          
        </div>
      </main>
    </div>
  )
}

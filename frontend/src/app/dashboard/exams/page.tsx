'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronRight, FileText, CheckCircle, TrendingUp, Search, Plus } from 'lucide-react'
import ExamTable, { Exam } from '../../../components/exams/ExamTable'
import { Pagination } from '../../../components/ui/Pagination'

export default function ExamsPage() {
  return (
    <Suspense fallback={<div className="p-8">Đang tải dữ liệu...</div>}>
      <ExamsPageContent />
    </Suspense>
  )
}

function ExamsPageContent() {
  const searchParams = useSearchParams();
  const mockExams: Exam[] = [
    {
      id: 'E-01',
      title: 'Kiểm tra Giữa kỳ I - Đại số 10',
      grade: 10,
      questionCount: 50,
      duration: 90,
      examType: 'Giữa kỳ',
      updatedAt: '2 giờ trước'
    },
    {
      id: 'E-02',
      title: 'Ôn tập Hình học Giải tích',
      grade: 12,
      questionCount: 35,
      duration: 60,
      examType: 'Cuối kỳ',
      updatedAt: 'Hôm qua'
    },
    {
      id: 'E-03',
      title: 'Kiểm tra 15p - Đạo hàm',
      grade: 11,
      questionCount: 20,
      duration: 15,
      examType: 'Chuyên',
      updatedAt: '3 ngày trước'
    }
  ]

  const gradeFilter = searchParams.get('grade') || '';
  const durationFilter = searchParams.get('duration') || '';
  const examTypeFilter = searchParams.get('examType') || '';
  const q = searchParams.get('q') || '';

  let filteredExams = mockExams;

  if (q) {
    filteredExams = filteredExams.filter(exam => 
      exam.title.toLowerCase().includes(q.toLowerCase())
    );
  }

  if (gradeFilter) {
    const match = gradeFilter.match(/\d+/);
    if (match) {
      const gradeNum = parseInt(match[0], 10);
      filteredExams = filteredExams.filter(exam => exam.grade === gradeNum);
    }
  }

  if (durationFilter) {
    const match = durationFilter.match(/\d+/);
    if (match) {
      const durationNum = parseInt(match[0], 10);
      filteredExams = filteredExams.filter(exam => exam.duration === durationNum);
    }
  }

  if (examTypeFilter) {
    filteredExams = filteredExams.filter(exam => exam.examType === examTypeFilter);
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto relative pb-20">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <span className="hover:text-primary cursor-pointer transition-colors">Trang chủ</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary font-bold">Kho lưu trữ đề thi</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Danh sách Đề thi <span className="text-slate-500 font-normal text-lg">( {filteredExams.length} đề )</span></h1>
        </div>
      </div>

          <ExamTable exams={filteredExams} />
          
          {filteredExams.length > 0 && (
            <div className="pt-0">
              <Pagination 
                currentPage={1} 
                totalPages={Math.ceil(filteredExams.length / 10) || 1} 
                totalItems={filteredExams.length} 
                startIndex={filteredExams.length > 0 ? 1 : 0} 
                endIndex={Math.min(10, filteredExams.length)} 
                itemName="đề thi"
              />
            </div>
          )}
          
      
    </div>
  )
}

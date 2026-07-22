'use client'

import React, { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronRight, FileText, CheckCircle, TrendingUp, Search, Plus } from 'lucide-react'
import ExamTable, { Exam } from '@/components/exams/ExamTable'
import { Pagination } from '@/components/ui/Pagination'

export default function ExamsPage() {
  return (
    <Suspense fallback={<div className="p-8">Đang tải dữ liệu...</div>}>
      <ExamsPageContent />
    </Suspense>
  )
}

function ExamsPageContent() {
  const searchParams = useSearchParams();
  const [exams, setExams] = useState<Exam[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setIsLoading(true)
        const { getExams } = await import('@/lib/api')
        const data = await getExams()
        setExams(data || [])
      } catch (err) {
        console.error('Failed to fetch exams:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchExams()
  }, [])

  const gradeFilter = searchParams.get('grade') || '';
  const durationFilter = searchParams.get('duration') || '';
  const examTypeFilter = searchParams.get('examType') || '';
  const q = searchParams.get('q') || '';

  let filteredExams = exams;

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
    filteredExams = filteredExams.filter(exam => exam.type === examTypeFilter);
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

          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <ExamTable exams={filteredExams} />
          )}
          
          {!isLoading && filteredExams.length > 0 && (
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

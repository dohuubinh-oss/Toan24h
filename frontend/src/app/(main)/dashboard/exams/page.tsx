'use client'

import React, { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { ChevronRight, FileText, CheckCircle, TrendingUp, Search, Plus, RefreshCw } from 'lucide-react'
import ExamTable, { Exam } from '@/components/exams/ExamTable'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { deleteExam } from '@/lib/api'

export default function ExamsPage() {
  return (
    <Suspense fallback={<div className="p-8">Đang tải dữ liệu...</div>}>
      <ExamsPageContent />
    </Suspense>
  )
}

function ExamsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const fetchExams = async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
      const { getExams } = await import('@/lib/api')
      const data = await getExams()
      setExams(data || [])
    } catch (err: any) {
      console.error('Failed to fetch exams:', err)
      setExams([])
      setLoadError(err?.message || 'Không thể tải danh sách đề thi. Vui lòng kiểm tra lại kết nối mạng!')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchExams()
  }, [])

  const handleDelete = async () => {
    if (deleteId) {
      await deleteExam(deleteId);
      setDeleteId(null);
      fetchExams();
    }
  }

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
    filteredExams = filteredExams.filter(exam => exam.grade === gradeFilter);
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

  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 10;
  const totalPages = Math.ceil(filteredExams.length / pageSize) || 1;
  const currentPage = Math.min(Math.max(1, pageParam), totalPages);
  const startIndex = filteredExams.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(currentPage * pageSize, filteredExams.length);
  const paginatedExams = filteredExams.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto relative pb-20">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <span className="hover:text-primary cursor-pointer transition-colors">Trang chủ</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary font-bold">Kho lưu trữ đề thi</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Danh sách Bài thi <span className="text-slate-500 font-normal text-lg">( {filteredExams.length} đề )</span></h1>
        </div>

        <Link 
          href="/dashboard/questions" 
          className="px-4 py-2 bg-primary text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm min-h-[44px] text-xs sm:text-sm cursor-pointer"
        >
          <Plus size={18} />
          <span>Chọn câu hỏi tạo đề</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : loadError ? (
        <div className="bg-white rounded-2xl border border-red-200/80 p-12 flex flex-col items-center justify-center text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-1">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Không thể tải dữ liệu đề thi</h3>
          <p className="text-xs text-slate-500 max-w-md">{loadError}</p>
          <button
            type="button"
            onClick={fetchExams}
            className="mt-2 px-5 py-2.5 bg-primary hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer min-h-[40px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      ) : (
        <ExamTable exams={paginatedExams} onDelete={(id) => setDeleteId(id)} />
      )}
      
      {!isLoading && !loadError && filteredExams.length > 0 && (
        <div className="pt-0">
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            totalItems={filteredExams.length} 
            startIndex={startIndex} 
            endIndex={endIndex} 
            itemName="đề thi"
            onPageChange={(page) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('page', page.toString());
              router.push(`?${params.toString()}`, { scroll: true });
            }}
          />
        </div>
      )}
          
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa đề thi"
        description="Bạn có chắc chắn muốn xóa đề thi này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        isDestructive={true}
      />
    </div>
  )
}

import React from 'react';
import Link from 'next/link';
import { ChevronRight, PenTool } from 'lucide-react';
import { PracticeCard } from '@/components/practices/PracticeCard';
import { Pagination } from '@/components/ui/Pagination';
import { fetchPracticesByGrade } from '@/data/mockPracticeData';

export default async function GradePracticesPage({
  params,
  searchParams,
}: {
  params: Promise<{ grade: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const grade = resolvedParams.grade;
  const lectureId = resolvedSearchParams.lecture as string | undefined;
  
  // Xử lý page params cho Pagination
  const pageParam = resolvedSearchParams.page;
  const currentPage = typeof pageParam === 'string' ? parseInt(pageParam, 10) : 1;
  const limit = 6;

  // Lấy dữ liệu
  const { practices, totalItems, totalPages } = await fetchPracticesByGrade(grade, currentPage, limit, lectureId);

  // Tính toán index hiển thị
  const startIndex = (currentPage - 1) * limit + 1;
  const endIndex = Math.min(currentPage * limit, totalItems);

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <Link href="/student" className="hover:text-primary transition-colors min-h-[44px] flex items-center">
              Dashboard
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary font-bold min-h-[44px] flex items-center">Luyện tập</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Danh sách Đề luyện tập Khối {grade}</h1>
        </div>
      </div>

      {lectureId && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
          <span className="font-medium text-sm">
            Đang hiển thị đề luyện tập thuộc Bài giảng ID: <strong className="ml-1">{lectureId}</strong>
          </span>
          <Link href={`/practices/lop/${grade}`} className="text-sm font-semibold hover:underline text-blue-600 min-h-[44px] flex items-center">
            Bỏ lọc
          </Link>
        </div>
      )}

      {/* Grid danh sách Luyện tập */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {practices.map((practice) => (
          <PracticeCard 
            key={practice.id}
            {...practice}
          />
        ))}
        {practices.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <PenTool className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-700">Chưa có đề luyện tập nào</p>
            <p className="text-sm mt-1 mb-6 text-center max-w-md">Hiện tại chưa có đề luyện tập nào được đăng tải cho khối {grade}{lectureId ? ' với bộ lọc này' : ''}. Vui lòng quay lại sau.</p>
            <Link 
              href="/student" 
              className="h-12 px-6 rounded-lg bg-primary text-white font-semibold flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm"
            >
              Quay về Dashboard
            </Link>
          </div>
        )}
      </div>

      {/* Phân trang */}
      {totalPages > 1 && practices.length > 0 && (
        <div className="mt-8">
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            itemName="đề luyện tập"
          />
        </div>
      )}
    </div>
  );
}

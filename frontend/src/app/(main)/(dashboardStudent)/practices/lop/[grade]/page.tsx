import React from 'react';
import { ChevronRight } from 'lucide-react';
import { PracticeCard, PracticeStatus } from '@/components/practices/PracticeCard';
import { Pagination } from '@/components/ui/Pagination';

// Mock data: Toán lớp 8
const MOCK_PRACTICES = [
  {
    id: 'P8-01',
    title: 'Đề luyện tập: Nhân đơn thức với đa thức',
    lectureName: 'Nhân đơn thức với đa thức',
    duration: 15,
    questionCount: 10,
    status: 'completed' as PracticeStatus,
    score: 8,
  },
  {
    id: 'P8-02',
    title: 'Đề kiểm tra 15 phút: Nhân đa thức',
    lectureName: 'Nhân đa thức với đa thức',
    duration: 15,
    questionCount: 10,
    status: 'completed' as PracticeStatus,
    score: 3,
  },
  {
    id: 'P8-03',
    title: 'Bài tập vận dụng: Hằng đẳng thức (Phần 1)',
    lectureName: 'Những hằng đẳng thức đáng nhớ (Phần 1)',
    duration: 30,
    questionCount: 20,
    status: 'not_started' as PracticeStatus,
  },
  {
    id: 'P8-04',
    title: 'Bài tập nâng cao: Hằng đẳng thức',
    lectureName: 'Những hằng đẳng thức đáng nhớ (Phần 2)',
    duration: 45,
    questionCount: 30,
    status: 'not_started' as PracticeStatus,
  },
  {
    id: 'P8-05',
    title: 'Kiểm tra 1 tiết: Tứ giác',
    lectureName: 'Tứ giác',
    duration: 45,
    questionCount: 30,
    status: 'not_started' as PracticeStatus,
  },
  {
    id: 'P8-06',
    title: 'Luyện tập chung: Hình thang cân',
    lectureName: 'Hình thang - Hình thang cân',
    duration: 30,
    questionCount: 20,
    status: 'not_started' as PracticeStatus,
  },
];

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
  const lectureId = resolvedSearchParams.lecture;

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <span className="hover:text-primary cursor-pointer transition-colors">Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary font-bold">Luyện tập</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Danh sách Đề luyện tập Khối {grade}</h1>
        </div>
      </div>

      {lectureId && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl flex items-center justify-between">
          <span className="font-medium text-sm">
            Đang hiển thị đề luyện tập thuộc Bài giảng ID: <strong className="ml-1">{lectureId}</strong>
          </span>
          <a href={`/practices/lop/${grade}`} className="text-sm font-semibold hover:underline text-blue-600">
            Bỏ lọc
          </a>
        </div>
      )}

      {/* Grid danh sách Luyện tập */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_PRACTICES.map((practice) => (
          <PracticeCard 
            key={practice.id}
            {...practice}
          />
        ))}
      </div>

      {/* Phân trang */}
      <div className="mt-8">
        <Pagination 
          currentPage={1}
          totalPages={8}
          totalItems={48}
          startIndex={1}
          endIndex={6}
          itemName="đề luyện tập"
        />
      </div>
    </div>
  );
}

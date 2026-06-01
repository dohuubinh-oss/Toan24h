import React from 'react';
import { ChevronRight } from 'lucide-react';
import { LectureCard, LectureStatus } from '@/components/lectures/LectureCard';
import { Pagination } from '@/components/ui/Pagination';

// Mock data: Toán lớp 8
const MOCK_LECTURES = [
  {
    id: 'L8-01',
    title: 'Nhân đơn thức với đa thức',
    chapter: 'Chương 1: Phép nhân và phép chia các đa thức',
    status: 'completed' as LectureStatus,
    practiceCount: 3,
  },
  {
    id: 'L8-02',
    title: 'Nhân đa thức với đa thức',
    chapter: 'Chương 1: Phép nhân và phép chia các đa thức',
    status: 'in_progress' as LectureStatus,
    practiceCount: 4,
  },
  {
    id: 'L8-03',
    title: 'Những hằng đẳng thức đáng nhớ (Phần 1)',
    chapter: 'Chương 1: Phép nhân và phép chia các đa thức',
    status: 'not_started' as LectureStatus,
    practiceCount: 5,
  },
  {
    id: 'L8-04',
    title: 'Những hằng đẳng thức đáng nhớ (Phần 2)',
    chapter: 'Chương 1: Phép nhân và phép chia các đa thức',
    status: 'not_started' as LectureStatus,
    practiceCount: 2,
  },
  {
    id: 'L8-05',
    title: 'Tứ giác',
    chapter: 'Chương 2: Tứ giác',
    status: 'not_started' as LectureStatus,
    practiceCount: 3,
  },
  {
    id: 'L8-06',
    title: 'Hình thang - Hình thang cân',
    chapter: 'Chương 2: Tứ giác',
    status: 'not_started' as LectureStatus,
    practiceCount: 4,
  },
];

export default async function GradeLecturesPage({
  params,
}: {
  params: Promise<{ grade: string }>
}) {
  const resolvedParams = await params;
  const grade = resolvedParams.grade; // VD: '5', '8', '9'

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <span className="hover:text-primary cursor-pointer transition-colors">Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary font-bold">Bài giảng</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Danh sách Bài giảng Khối {grade}</h1>
        </div>
      </div>

      {/* Grid danh sách Bài giảng */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_LECTURES.map((lecture) => (
          <LectureCard 
            key={lecture.id}
            {...lecture}
          />
        ))}
      </div>

      {/* Phân trang */}
      <div className="mt-8">
        <Pagination 
          currentPage={1}
          totalPages={10}
          totalItems={60}
          startIndex={1}
          endIndex={6}
          itemName="bài giảng"
        />
      </div>
    </div>
  );
}

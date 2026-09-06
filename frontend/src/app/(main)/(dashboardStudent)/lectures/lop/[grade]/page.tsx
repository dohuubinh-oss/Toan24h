import React from 'react';
import Link from 'next/link';
import { ChevronRight, BookOpen } from 'lucide-react';
import { LectureCard } from '@/components/lectures/LectureCard';
import { Pagination } from '@/components/ui/Pagination';
import { getLecturesByGrade } from '@/lib/lectureApi';
import { getExams, getMyExamResults } from '@/lib/api';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function GradeLecturesPage({
  params,
  searchParams,
}: {
  params: Promise<{ grade: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const grade = resolvedParams.grade; // VD: '5', '8', '9'
  const page = parseInt(resolvedSearchParams.page as string || '1', 10);

  // Lấy userGrade từ cookie để tự động redirect
  const cookieStore = await cookies();
  const userGradeCookie = cookieStore.get('userGrade');
  const userRoleCookie = cookieStore.get('userRole');
  
  if (userRoleCookie?.value === 'student' && userGradeCookie && userGradeCookie.value !== grade && userGradeCookie.value !== '') {
    redirect(`/lectures/lop/${userGradeCookie.value}`);
  }

  const token = cookieStore.get('accessToken')?.value;

  const [lecturesResult, examsData, resultsData] = await Promise.all([
    getLecturesByGrade(grade, page, 9),
    getExams(),
    token ? getMyExamResults(token) : Promise.resolve([])
  ]);

  const { data: lectures, totalPages, totalItems, startIndex, endIndex, currentPage } = lecturesResult;

  const mappedLectures = lectures.map(lecture => {
    // Find all practices for this lecture
    const lectureExams = examsData.filter((exam: any) => exam.cate === 'practice' && exam.lectureId === lecture.id);
    const practiceCount = lectureExams.length;
    
    // Count how many are completed with score > 6.5
    let completedWellCount = 0;
    lectureExams.forEach((exam: any) => {
      // Find the latest result for this exam
      const examResults = resultsData.filter((r: any) => r.examId === exam.id);
      examResults.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      const latestResult = examResults.length > 0 ? examResults[0] : null;
      if (latestResult && latestResult.status === 'COMPLETED' && latestResult.totalScore > 6.5) {
        completedWellCount++;
      }
    });

    return {
      ...lecture,
      practiceCount,
      completedWellCount
    };
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <Link href="/student" className="hover:text-primary transition-colors min-h-[44px] flex items-center">
              Dashboard
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary font-bold min-h-[44px] flex items-center">Bài giảng</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Danh sách Bài giảng Khối {grade}</h1>
        </div>
      </div>

      {/* Grid danh sách Bài giảng */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mappedLectures.map((lecture) => (
          <LectureCard 
            key={lecture.id}
            grade={grade}
            {...lecture}
          />
        ))}
        {mappedLectures.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-700">Chưa có bài giảng nào</p>
            <p className="text-sm mt-1 mb-6 text-center max-w-md">Hiện tại chưa có bài giảng nào được đăng tải cho khối {grade}. Vui lòng quay lại sau hoặc chọn khối lớp khác.</p>
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
      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            itemName="bài giảng"
          />
        </div>
      )}
    </div>
  );
}

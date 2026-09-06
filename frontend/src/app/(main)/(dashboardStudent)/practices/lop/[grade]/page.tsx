import React from 'react';
import Link from 'next/link';
import { ChevronRight, PenTool } from 'lucide-react';
import PracticeTable from '@/components/practices/PracticeTable';
import { Pagination } from '@/components/ui/Pagination';
import { getExams, getMyExamResults } from '@/lib/api';
import { Practice } from '@/types/practice';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

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
  const lectureName = resolvedSearchParams.lectureName as string | undefined;
  const practiceIdsParam = resolvedSearchParams.practiceIds as string | undefined;
  let practiceIdsArray: string[] | undefined = undefined;
  if (practiceIdsParam) {
    try {
      practiceIdsArray = JSON.parse(practiceIdsParam);
    } catch (e) {
      console.error("Failed to parse practiceIdsParam", e);
    }
  }
  
  // Xử lý page params cho Pagination
  const pageParam = resolvedSearchParams.page;
  const currentPage = typeof pageParam === 'string' ? parseInt(pageParam, 10) : 1;
  const limit = 6;

  // Lấy userGrade từ cookie để tự động redirect
  const cookieStore = await cookies();
  const userGradeCookie = cookieStore.get('userGrade');
  const userRoleCookie = cookieStore.get('userRole');
  
  if (userRoleCookie?.value === 'student' && userGradeCookie && userGradeCookie.value !== grade && userGradeCookie.value !== '') {
    redirect(`/practices/lop/${userGradeCookie.value}`);
  }

  const token = cookieStore.get('accessToken')?.value;

  // Lấy dữ liệu
  let allExams = [];
  let myResults: any[] = [];
  try {
    const [examsData, resultsData] = await Promise.all([
      getExams(),
      token ? getMyExamResults(token) : Promise.resolve([])
    ]);
    allExams = examsData;
    myResults = resultsData;
  } catch (error) {
    console.error("Failed to load exams or results", error);
  }

  // Filter for practice and grade
  let practicesData = allExams.filter((exam: any) => exam.cate === 'practice' && String(exam.grade) === String(grade));

  if (practiceIdsArray && practiceIdsArray.length > 0) {
    practicesData = practicesData.filter((item: any) => practiceIdsArray.includes(item.id));
  } else if (lectureId) {
    practicesData = practicesData.filter((item: any) => item.lectureId === lectureId);
  }

  // Sắp xếp theo ngày tạo (cũ nhất đến mới nhất) để bài tập hiện theo thứ tự được tạo
  practicesData = practicesData.sort((a: any, b: any) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const totalItems = practicesData.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const startIndex = totalItems > 0 ? (currentPage - 1) * limit + 1 : 0;
  const endIndex = Math.min(currentPage * limit, totalItems);

  // Apply pagination
  const paginatedData = practicesData.slice((currentPage - 1) * limit, currentPage * limit);

  // Map to Practice format
  const practices: Practice[] = paginatedData.map((exam: any) => {
    // Find the latest result for this exam
    const examResults = myResults.filter((r: any) => r.examId === exam.id);
    // Sort by created_at desc (if not already)
    examResults.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const latestResult = examResults.length > 0 ? examResults[0] : null;
    let status: 'NOT_STARTED' | 'PENDING' | 'COMPLETED' = 'NOT_STARTED';
    let score = undefined;

    if (latestResult) {
      if (latestResult.status === 'COMPLETED') {
        status = 'COMPLETED';
        score = latestResult.totalScore;
      } else if (latestResult.status === 'PENDING') {
        status = 'PENDING';
      }
    }

    return {
      id: exam.id,
      title: exam.title,
      lectureName: lectureName || exam.lectureName || 'Bài giảng liên kết', 
      duration: exam.duration || 0,
      questionCount: exam.questionIds ? exam.questionIds.length : 0,
      status: status,
      score: score, 
      grade: String(exam.grade),
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
            <span className="text-primary font-bold min-h-[44px] flex items-center">Luyện tập</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {lectureName ? `Đề luyện tập Khối ${grade} - ${lectureName}` : `Danh sách Đề luyện tập Khối ${grade}`}
          </h1>
        </div>
      </div>



      {/* Bảng danh sách Luyện tập */}
      <PracticeTable practices={practices} />

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

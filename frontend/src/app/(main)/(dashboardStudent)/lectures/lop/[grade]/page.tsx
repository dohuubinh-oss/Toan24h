import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, BookOpen, ArrowLeft } from 'lucide-react';
import { ClientPagination } from '@/components/ui/ClientPagination';
import { getLecturesByGrade } from '@/lib/lectureApi';
import { getExams, getMyExamResults } from '@/lib/api';
import LectureAntiCheatTracker from '@/components/lecture/LectureAntiCheatTracker';
import { calculateLectureProgression } from '@/lib/lectureProgression';
import { GradeLectureList } from '@/components/lectures/GradeLectureList';
import { GradeRestrictionModal } from '@/components/lectures/GradeRestrictionModal';
import { cookies } from 'next/headers';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ grade: string }>;
}): Promise<Metadata> {
  const { grade } = await params;
  return {
    title: `Bài Giảng Toán Lớp ${grade} - Tóm Tắt Lý Thuyết & Dạng Bài Trọng Tâm`,
    description: `Hệ thống bài giảng Toán lớp ${grade} chuẩn sách giáo khoa mới. Tổng hợp lý thuyết, phương pháp giải nhanh và bài tập tự luyện có hướng dẫn chi tiết.`,
    alternates: {
      canonical: `/lectures/lop/${grade}`,
    },
  };
}

export default async function GradeLecturesPage({
  params,
  searchParams,
}: {
  params: Promise<{ grade: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const grade = resolvedParams.grade; // VD: '5', '6', '7', '8', '9'
  const page = parseInt((resolvedSearchParams.page as string) || '1', 10);
  const returnUrl = resolvedSearchParams?.returnUrl as string | undefined;
  const examId = resolvedSearchParams?.examId as string | undefined;

  // Kiểm tra quyền hạn khối lớp theo gói học (Bảo vệ bản quyền gói học & chống share tài khoản)
  const cookieStore = await cookies();
  const userGradeCookie = cookieStore.get('userGrade');
  const userRoleCookie = cookieStore.get('userRole');

  // Nếu là học sinh và truy cập ngoài khối lớp đăng ký -> hiển thị thông báo bản quyền thân thiện
  if (
    userRoleCookie?.value === 'student' &&
    userGradeCookie &&
    userGradeCookie.value !== grade &&
    userGradeCookie.value !== ''
  ) {
    return (
      <div className="space-y-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/student" className="hover:text-primary transition-colors min-h-[44px] flex items-center">
            Dashboard
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" aria-hidden="true" />
          <span className="text-primary font-bold min-h-[44px] flex items-center" aria-current="page">
            Bài giảng Khối {grade}
          </span>
        </nav>
        <GradeRestrictionModal
          userGrade={userGradeCookie.value}
          attemptedGrade={grade}
        />
      </div>
    );
  }

  const token = cookieStore.get('accessToken')?.value;

  const [lecturesResult, examsData, resultsData] = await Promise.all([
    getLecturesByGrade(grade, page, 12),
    getExams({ grade }),
    token ? getMyExamResults(token) : Promise.resolve([]),
  ]);

  const {
    data: lectures,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    currentPage,
  } = lecturesResult;

  // Tính toán trạng thái học tập và khóa/mở khóa liên hoàn (Mastery Progression)
  const mappedLectures = calculateLectureProgression(lectures, examsData, resultsData);

  return (
    <div className="space-y-8">
      {examId && <LectureAntiCheatTracker examId={examId} />}

      {/* Banner khi học sinh tham khảo bài giảng trong phòng thi */}
      {returnUrl && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-primary/5 border border-primary/20 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3 text-slate-800 font-medium">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="text-sm">
              Bạn đang tham khảo lý thuyết bài giảng trong quá trình làm bài tập.
            </span>
          </div>
          <Link
            href={returnUrl}
            className="min-h-[44px] h-11 px-5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all text-sm shadow-sm active:scale-95 flex items-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Trở về bài tập đang làm</span>
          </Link>
        </div>
      )}

      {/* Header và Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <Link
              href="/student"
              className="hover:text-primary transition-colors min-h-[44px] flex items-center px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              Dashboard
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" aria-hidden="true" />
            <span className="text-primary font-bold min-h-[44px] flex items-center px-1" aria-current="page">
              Bài giảng Khối {grade}
            </span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Danh sách Bài giảng Toán Lớp {grade}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tổng hợp lý thuyết trọng tâm và bộ bài tập rèn luyện tư duy theo chương trình chuẩn.
          </p>
        </div>
      </div>

      {/* Toolbar và Danh sách Bài giảng có viền trạng thái & khóa tiến độ */}
      <GradeLectureList
        lectures={mappedLectures}
        grade={grade}
        returnUrl={returnUrl}
        examId={examId}
      />

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="mt-8">
          <ClientPagination
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

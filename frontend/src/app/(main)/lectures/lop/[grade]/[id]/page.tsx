import React from 'react'
import LectureHeader from '@/components/lecture/LectureHeader'
import { LectureConcept, LectureExamples } from '@/components/lecture/LectureContent'
import LectureSidebar from '@/components/lecture/LectureSidebar'
import { getLectureById } from '@/lib/lectureApi'
import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { PenTool, ArrowLeft } from 'lucide-react'
import LectureAntiCheatTracker from '@/components/lecture/LectureAntiCheatTracker'

export default async function GradeLecturePage({
  params,
  searchParams,
}: {
  params: Promise<{ grade: string, id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params;
  const { grade, id } = resolvedParams;
  const resolvedSearchParams = await searchParams;
  const returnUrl = resolvedSearchParams?.returnUrl as string | undefined;
  const examId = resolvedSearchParams?.examId as string | undefined;

  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value

  let shouldRedirect = false;

  if (token) {
    try {
      // Temporarily disabled progression lock
      const payloadBase64 = token.split('.')[1] || token
      const payloadString = atob(payloadBase64)
      const payload = JSON.parse(payloadString)
      // Removed the redirect logic for now to allow viewing all lectures
    } catch (e) {
      console.error('Failed to parse token for progression check', e)
    }
  }

  let lecture;
  let examples = [];
  try {
    lecture = await getLectureById(id);
    examples = JSON.parse(lecture.examples || '[]');
  } catch (error) {
    console.error("Failed to load lecture:", error);
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
      {examId && <LectureAntiCheatTracker examId={examId} />}
      <LectureHeader 
        title={lecture.title}
        grade={lecture.grade}
        category={lecture.category}
        createdAt={lecture.createdAt}
        id={lecture.id}
      />

      {/* Card Giải thích khái niệm chiếm 100% chiều rộng */}
      <LectureConcept basicConcept={lecture.basicConcept} />

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Card Phân tích bài tập mẫu trong layout chia cột */}
          <LectureExamples examples={examples} />
          {/* Nút hành động cuối bài giảng */}
          <div className="pt-2 flex flex-col sm:flex-row gap-4">
            {returnUrl && (
              <Link 
                href={returnUrl}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 font-bold rounded-xl transition-all text-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 shadow-md hover:shadow-lg hover:-translate-y-1"
              >
                <ArrowLeft size={24} />
                Trở về bài thi
              </Link>
            )}
            <Link 
              href={`/practices/lop/${grade}?lecture=${id}&lectureName=${encodeURIComponent(lecture.title)}${lecture.practiceIds ? `&practiceIds=${encodeURIComponent(lecture.practiceIds)}` : ''}`}
              className="flex-1 flex items-center justify-center gap-3 px-6 py-4 font-bold rounded-xl transition-all text-lg bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg hover:-translate-y-1"
            >
              <PenTool size={24} />
              Làm bài tập
            </Link>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <LectureSidebar />
        </div>
      </div>
    </div>
  )
}

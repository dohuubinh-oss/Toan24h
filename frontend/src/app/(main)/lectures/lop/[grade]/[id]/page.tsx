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

      {returnUrl && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 text-indigo-950 font-medium">
            <ArrowLeft className="w-5 h-5 text-indigo-600 shrink-0" />
            <span className="text-sm">Bạn đang tham khảo bài giảng này trong quá trình làm bài tập.</span>
          </div>
          <Link
            href={returnUrl}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all text-sm shadow-sm active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Trở về bài tập đang làm
          </Link>
        </div>
      )}

      <LectureHeader 
        title={lecture.title}
        grade={lecture.grade}
        category={lecture.category}
        createdAt={lecture.createdAt}
        id={lecture.id}
        author={lecture.author}
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
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 font-bold rounded-xl transition-all text-lg bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-md hover:shadow-lg hover:-translate-y-1"
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

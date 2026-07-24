import React from 'react'
import LectureHeader from '@/components/lecture/LectureHeader'
import { LectureConcept, LectureExamples } from '@/components/lecture/LectureContent'
import LectureSidebar from '@/components/lecture/LectureSidebar'
import { getLectureById } from '@/lib/lectureApi'
import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { PenTool } from 'lucide-react'

export default async function GradeLecturePage({
  params,
}: {
  params: Promise<{ grade: string, id: string }>
}) {
  const resolvedParams = await params;
  const { grade, id } = resolvedParams;

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
          {/* Nút Luyện tập cuối bài giảng */}
          <div className="pt-2">
            <Link 
              href={`/practices/lop/${grade}?lecture=${id}&lectureName=${encodeURIComponent(lecture.title)}${lecture.practiceIds ? `&practiceIds=${encodeURIComponent(lecture.practiceIds)}` : ''}`}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 font-bold rounded-xl transition-all text-lg bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg hover:-translate-y-1"
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

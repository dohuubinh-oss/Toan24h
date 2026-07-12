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

  if (token) {
    try {
      const payloadBase64 = token.split('.')[1] || token
      const payloadString = atob(payloadBase64)
      const payload = JSON.parse(payloadString)

      if (payload.role === 'student') {
        // Mock progression lock: Giả lập học sinh phải hoàn thành bài 1 điểm > 7 mới được học bài khác
        // Ở đây giả lập học sinh chỉ được vào bài có id === '1'
        if (id !== '1' && id !== 'lecture-1') {
          redirect(`/lectures/lop/${grade}?error=not_completed`)
        }
      }
    } catch (e) {
      console.error('Failed to parse token for progression check', e)
    }
  }

  let lecture;
  let mediaItems = [];
  let examples = [];
  try {
    lecture = await getLectureById(id);
    mediaItems = JSON.parse(lecture.mediaItems || '[]');
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
      <LectureConcept basicConcept={lecture.basicConcept} mediaItems={mediaItems} />

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Card Phân tích bài tập mẫu trong layout chia cột */}
          <LectureExamples examples={examples} />
          {/* Nút Luyện tập cuối bài giảng */}
          <div className="pt-8 border-t border-slate-200">
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

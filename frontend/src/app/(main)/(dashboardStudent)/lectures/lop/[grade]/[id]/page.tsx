import React from 'react'
import LectureHeader from '@/components/lecture/LectureHeader'
import LectureContent from '@/components/lecture/LectureContent'
import LectureSidebar from '@/components/lecture/LectureSidebar'
import LectureMediaViewer from '@/components/lecture/LectureMediaViewer'
import { getLectureById } from '@/lib/lectureApi'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PenTool } from 'lucide-react'

export default async function GradeLecturePage({
  params,
}: {
  params: Promise<{ grade: string, id: string }>
}) {
  const resolvedParams = await params;
  const { grade, id } = resolvedParams;

  let lecture;
  try {
    lecture = await getLectureById(id);
  } catch (error) {
    console.error("Failed to load lecture:", error);
    notFound();
  }

  return (
    <div className="space-y-8">
      <LectureHeader 
        title={lecture.title}
        grade={lecture.grade}
        category={lecture.category}
        createdAt={lecture.createdAt}
        id={lecture.id}
      />

      {lecture.videoUrl ? (
        <LectureMediaViewer mediaType="youtube" url={lecture.videoUrl} />
      ) : lecture.coverImage ? (
        <LectureMediaViewer mediaType="image" url={lecture.coverImage} />
      ) : null}

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <LectureContent 
            basicConcept={lecture.basicConcept}
            examples={lecture.examples}
          />
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

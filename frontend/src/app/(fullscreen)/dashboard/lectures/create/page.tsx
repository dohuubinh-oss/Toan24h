'use client'
import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import LectureCreatorHeader from '@/components/lecture/creator/LectureCreatorHeader'
import LectureBasicSettings from '@/components/lecture/creator/LectureBasicSettings'
import LectureContentEditor from '@/components/lecture/creator/LectureContentEditor'
import { LectureCreatorProvider, useLectureCreator } from '@/components/lecture/creator/LectureCreatorContext'
import { Loader2 } from 'lucide-react'

function CreateLectureContent() {
  const searchParams = useSearchParams()
  const editId = searchParams.get('editId')

  return (
    <LectureCreatorProvider editId={editId}>
      <LectureEditorBody />
    </LectureCreatorProvider>
  )
}

function LectureEditorBody() {
  const { isLoading } = useLectureCreator()

  if (isLoading) {
    return (
      <div className="bg-slate-50 min-h-screen flex flex-col items-center justify-center font-display">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-slate-600 font-medium text-lg">Đang tải nội dung bài giảng...</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 min-h-screen font-display pb-20 lg:pb-0">
      <LectureCreatorHeader />
      
      <main className="max-w-7xl mx-auto p-4 lg:p-6 pb-28 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <LectureContentEditor />
          </div>
          
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <LectureBasicSettings />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function CreateLecturePage() {
  return (
    <Suspense fallback={
      <div className="bg-slate-50 min-h-screen flex items-center justify-center font-display">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <CreateLectureContent />
    </Suspense>
  )
}

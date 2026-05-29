import React from 'react'
import LectureCreatorHeader from '@/components/lecture/creator/LectureCreatorHeader'
import LectureBasicSettings from '@/components/lecture/creator/LectureBasicSettings'
import LectureContentEditor from '@/components/lecture/creator/LectureContentEditor'

export default function CreateLecturePage() {
  return (
    <div className="bg-background-light text-slate-900 min-h-screen pb-12">
      <LectureCreatorHeader />
      
      <main className="max-w-[1440px] mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <LectureContentEditor />
        </div>
        
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-24 space-y-6">
            <LectureBasicSettings />
          </div>
        </div>
      </main>
    </div>
  )
}

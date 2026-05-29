import React from 'react'
import LectureHeader from '@/components/lecture/LectureHeader'
import LectureContent from '@/components/lecture/LectureContent'
import LectureSidebar from '@/components/lecture/LectureSidebar'

export default function LecturePage() {
  return (
    <div className="space-y-8">
      <LectureHeader />
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <LectureContent />
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <LectureSidebar />
        </div>
      </div>
    </div>
  )
}

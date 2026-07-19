'use client'
import React from 'react'
import LectureCreatorHeader from '@/components/lecture/creator/LectureCreatorHeader'
import LectureBasicSettings from '@/components/lecture/creator/LectureBasicSettings'
import LectureContentEditor from '@/components/lecture/creator/LectureContentEditor'
import { LectureCreatorProvider } from '@/components/lecture/creator/LectureCreatorContext'

export default function CreateLecturePage() {
  return (
    <LectureCreatorProvider>
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
    </LectureCreatorProvider>
  )
}

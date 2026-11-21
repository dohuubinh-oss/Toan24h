'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useStudentLectureFilter } from '@/contexts/StudentLectureFilterContext'
import { useStudentExamFilter } from '@/contexts/StudentExamFilterContext'
import LectureFilterSidebar from '@/components/lectures/LectureFilterSidebar'
import StudentExamFilterSidebar from '@/components/exams/StudentExamFilterSidebar'

export function StudentFilterManager() {
  const pathname = usePathname()
  const lectureFilter = useStudentLectureFilter()
  const examFilter = useStudentExamFilter()

  const isLecturePage = pathname?.startsWith('/lectures')
  const isExamPage = pathname?.startsWith('/exams')

  if (isLecturePage) {
    if (!lectureFilter || !lectureFilter.isAvailable) {
      return null
    }

    return (
      <LectureFilterSidebar
        searchId="sidebar-lecture-search"
        searchQuery={lectureFilter.searchQuery}
        onSearchChange={lectureFilter.setSearchQuery}
        selectedChapter={lectureFilter.selectedChapter}
        onChapterChange={lectureFilter.setSelectedChapter}
        chapters={lectureFilter.chapters}
        chapterCounts={lectureFilter.chapterCounts}
        selectedStatus={lectureFilter.selectedStatus}
        onStatusChange={lectureFilter.setSelectedStatus}
        totalCount={lectureFilter.counts.total}
        completedCount={lectureFilter.counts.completed}
        pendingCount={lectureFilter.counts.pending}
        lockedCount={lectureFilter.counts.locked}
        isInsideSidebar={true}
      />
    )
  }

  if (isExamPage) {
    if (!examFilter || !examFilter.isAvailable) {
      return null
    }

    return (
      <StudentExamFilterSidebar
        totalCount={examFilter.totalExams}
        completedCount={examFilter.completedExams}
      />
    )
  }

  return null
}

export default StudentFilterManager

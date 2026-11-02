'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useStudentLectureFilter } from '@/contexts/StudentLectureFilterContext'
import LectureFilterSidebar from '@/components/lectures/LectureFilterSidebar'

export function StudentFilterManager() {
  const pathname = usePathname()
  const filter = useStudentLectureFilter()

  if (!filter || !filter.isAvailable) {
    return null
  }

  const isLecturePage = pathname?.startsWith('/lectures')

  if (!isLecturePage) {
    return null
  }

  return (
    <LectureFilterSidebar
      searchId="sidebar-lecture-search"
      searchQuery={filter.searchQuery}
      onSearchChange={filter.setSearchQuery}
      selectedChapter={filter.selectedChapter}
      onChapterChange={filter.setSelectedChapter}
      chapters={filter.chapters}
      chapterCounts={filter.chapterCounts}
      selectedStatus={filter.selectedStatus}
      onStatusChange={filter.setSelectedStatus}
      totalCount={filter.counts.total}
      completedCount={filter.counts.completed}
      pendingCount={filter.counts.pending}
      lockedCount={filter.counts.locked}
      isInsideSidebar={true}
    />
  )
}

export default StudentFilterManager

'use client'

import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react'

export interface FilterCounts {
  total: number
  completed: number
  pending: number
  locked: number
}

export interface StudentLectureFilterContextType {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedChapter: string
  setSelectedChapter: (chapter: string) => void
  selectedStatus: 'all' | 'completed' | 'pending' | 'locked'
  setSelectedStatus: (status: 'all' | 'completed' | 'pending' | 'locked') => void
  chapters: string[]
  setChapters: (chapters: string[]) => void
  chapterCounts: Record<string, number>
  setChapterCounts: (counts: Record<string, number>) => void
  counts: FilterCounts
  setCounts: (counts: FilterCounts) => void
  isAvailable: boolean
  setIsAvailable: (available: boolean) => void
  resetFilters: () => void
}

const StudentLectureFilterContext = createContext<StudentLectureFilterContextType | null>(null)

export function StudentLectureFilterProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChapter, setSelectedChapter] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'completed' | 'pending' | 'locked'>('all')
  const [chapters, setChapters] = useState<string[]>([])
  const [chapterCounts, setChapterCounts] = useState<Record<string, number>>({})
  const [counts, setCounts] = useState<FilterCounts>({
    total: 0,
    completed: 0,
    pending: 0,
    locked: 0,
  })
  const [isAvailable, setIsAvailable] = useState(false)

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedChapter('all')
    setSelectedStatus('all')
  }

  const value = useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      selectedChapter,
      setSelectedChapter,
      selectedStatus,
      setSelectedStatus,
      chapters,
      setChapters,
      chapterCounts,
      setChapterCounts,
      counts,
      setCounts,
      isAvailable,
      setIsAvailable,
      resetFilters,
    }),
    [searchQuery, selectedChapter, selectedStatus, chapters, chapterCounts, counts, isAvailable]
  )

  return (
    <StudentLectureFilterContext.Provider value={value}>
      {children}
    </StudentLectureFilterContext.Provider>
  )
}

export function useStudentLectureFilter() {
  return useContext(StudentLectureFilterContext)
}

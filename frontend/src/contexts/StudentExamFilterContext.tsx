'use client'

import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react'
import { ExamMilestone } from '@/lib/examMilestoneProgression'

export type ExamStatusFilter = 'all' | 'completed' | 'unsubmitted' | 'recommended'

export interface StudentExamFilterContextType {
  searchQuery: string
  setSearchQuery: (query: string) => void
  activeMilestone: ExamMilestone
  setActiveMilestone: (milestone: ExamMilestone) => void
  currentProgressMilestone: ExamMilestone
  setCurrentProgressMilestone: (milestone: ExamMilestone) => void
  counts: Record<ExamMilestone, number>
  setCounts: (counts: Record<ExamMilestone, number>) => void
  totalExams: number
  setTotalExams: (n: number) => void
  completedExams: number
  setCompletedExams: (n: number) => void
  selectedStatus: ExamStatusFilter
  setSelectedStatus: (status: ExamStatusFilter) => void
  isAvailable: boolean
  setIsAvailable: (available: boolean) => void
  resetFilters: () => void
}

const StudentExamFilterContext = createContext<StudentExamFilterContextType | null>(null)

export function StudentExamFilterProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeMilestone, setActiveMilestone] = useState<ExamMilestone>('midterm_1')
  const [currentProgressMilestone, setCurrentProgressMilestone] = useState<ExamMilestone>('midterm_1')
  const [counts, setCounts] = useState<Record<ExamMilestone, number>>({
    midterm_1: 0,
    final_1: 0,
    midterm_2: 0,
    final_2: 0,
    topics: 0,
  })
  const [totalExams, setTotalExams] = useState(0)
  const [completedExams, setCompletedExams] = useState(0)
  const [selectedStatus, setSelectedStatus] = useState<ExamStatusFilter>('all')
  const [isAvailable, setIsAvailable] = useState(false)

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedStatus('all')
  }

  const value = useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      activeMilestone,
      setActiveMilestone,
      currentProgressMilestone,
      setCurrentProgressMilestone,
      counts,
      setCounts,
      totalExams,
      setTotalExams,
      completedExams,
      setCompletedExams,
      selectedStatus,
      setSelectedStatus,
      isAvailable,
      setIsAvailable,
      resetFilters,
    }),
    [
      searchQuery,
      activeMilestone,
      currentProgressMilestone,
      counts,
      totalExams,
      completedExams,
      selectedStatus,
      isAvailable,
    ]
  )

  return (
    <StudentExamFilterContext.Provider value={value}>
      {children}
    </StudentExamFilterContext.Provider>
  )
}

export function useStudentExamFilter() {
  return useContext(StudentExamFilterContext)
}

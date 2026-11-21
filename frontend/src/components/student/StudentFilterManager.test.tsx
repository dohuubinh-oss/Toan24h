import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import StudentFilterManager from './StudentFilterManager'
import {
  StudentLectureFilterProvider,
  useStudentLectureFilter,
} from '@/contexts/StudentLectureFilterContext'
import {
  StudentExamFilterProvider,
  useStudentExamFilter,
} from '@/contexts/StudentExamFilterContext'
import * as navigation from 'next/navigation'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/lectures/lop/8'),
}))

function LectureTestHarness() {
  const filter = useStudentLectureFilter()

  React.useEffect(() => {
    if (filter) {
      filter.setChapters(['Đại số 8', 'Hình học 8'])
      filter.setChapterCounts({ 'Đại số 8': 6, 'Hình học 8': 4 })
      filter.setCounts({
        total: 10,
        completed: 6,
        pending: 2,
        locked: 2,
      })
      filter.setIsAvailable(true)
    }
  }, [])

  return <StudentFilterManager />
}

function ExamTestHarness() {
  const filter = useStudentExamFilter()

  React.useEffect(() => {
    if (filter) {
      filter.setCounts({
        midterm_1: 3,
        final_1: 2,
        midterm_2: 1,
        final_2: 0,
        topics: 4,
      })
      filter.setTotalExams(10)
      filter.setCompletedExams(5)
      filter.setIsAvailable(true)
    }
  }, [])

  return <StudentFilterManager />
}

describe('StudentFilterManager Component', () => {
  it('renders lecture progress and filter components inside sidebar when active on lecture route', () => {
    vi.mocked(navigation.usePathname).mockReturnValue('/lectures/lop/8')

    render(
      <StudentLectureFilterProvider>
        <StudentExamFilterProvider>
          <LectureTestHarness />
        </StudentExamFilterProvider>
      </StudentLectureFilterProvider>
    )

    expect(screen.getByText('Tiến độ học tập')).toBeInTheDocument()
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText('6 / 10 bài')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Tìm kiếm bài giảng/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Đại số 8/ })).toHaveTextContent('6')
    expect(screen.getByRole('button', { name: /Hình học 8/ })).toHaveTextContent('4')
    expect(screen.getByText('Đã hoàn thành')).toBeInTheDocument()
  })

  it('renders exam progress and filter components inside sidebar when active on exam route', () => {
    vi.mocked(navigation.usePathname).mockReturnValue('/exams/lop/5')

    render(
      <StudentLectureFilterProvider>
        <StudentExamFilterProvider>
          <ExamTestHarness />
        </StudentExamFilterProvider>
      </StudentLectureFilterProvider>
    )

    expect(screen.getByText('Tiến độ luyện đề')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText(/5 \/ 10 đề/i)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/Tìm kiếm đề thi/i)).not.toBeInTheDocument()
    expect(screen.queryByText('CHẶNG ĐỀ THI')).not.toBeInTheDocument()
  })
})

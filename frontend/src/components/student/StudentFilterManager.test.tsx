import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import StudentFilterManager from './StudentFilterManager'
import { StudentLectureFilterProvider, useStudentLectureFilter } from '@/context/StudentLectureFilterContext'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/lectures/lop/8'),
}))

function TestHarness() {
  const filter = useStudentLectureFilter()

  React.useEffect(() => {
    if (filter) {
      filter.setChapters(['Đại số 8', 'Hình học 8'])
      filter.setCounts({
        total: 10,
        completed: 6,
        pending: 2,
        locked: 2,
      })
      filter.setIsAvailable(true)
    }
  }, []) // run once on mount

  return <StudentFilterManager />
}

describe('StudentFilterManager Component', () => {
  it('renders lecture progress and filter components inside sidebar when active on lecture route', () => {
    render(
      <StudentLectureFilterProvider>
        <TestHarness />
      </StudentLectureFilterProvider>
    )

    expect(screen.getByText('Tiến độ học tập')).toBeInTheDocument()
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText('6 / 10 bài')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Tìm kiếm bài giảng/i)).toBeInTheDocument()
    expect(screen.getByText('Đại số 8')).toBeInTheDocument()
    expect(screen.getByText('Hình học 8')).toBeInTheDocument()
    expect(screen.getByText('Đã hoàn thành')).toBeInTheDocument()
  })
})

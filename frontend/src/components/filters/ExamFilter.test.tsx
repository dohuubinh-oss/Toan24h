import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ExamFilter } from './ExamFilter'

const mockSetFilter = vi.fn()

vi.mock('@/hooks/useSidebarFilter', () => ({
  useSidebarFilter: () => ({
    currentGrade: '',
    currentDifficulty: '',
    currentDuration: '',
    currentExamType: 'Giữa kì 1',
    setFilter: mockSetFilter,
    resetFilters: vi.fn(),
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/exams',
}))

describe('ExamFilter Component', () => {
  it('renders all 6 standardized exam types', () => {
    render(<ExamFilter />)
    expect(screen.getByText('Loại đề')).toBeInTheDocument()
    expect(screen.getByText('Giữa kì 1')).toBeInTheDocument()
    expect(screen.getByText('Cuối kì 1')).toBeInTheDocument()
    expect(screen.getByText('Giữa kì 2')).toBeInTheDocument()
    expect(screen.getByText('Cuối kì 2')).toBeInTheDocument()
    expect(screen.getByText('Chuyên Đề')).toBeInTheDocument()
    expect(screen.getByText('Ôn tập')).toBeInTheDocument()
  })
})

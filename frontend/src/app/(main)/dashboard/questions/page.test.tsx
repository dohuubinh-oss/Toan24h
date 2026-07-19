import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import QuestionsPage from './page'
import * as api from '@/lib/api'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/dashboard/questions',
}))

// Mock components
vi.mock('@/components/questions/QuestionSkeleton', () => ({
  default: () => <div data-testid="question-skeleton">Loading...</div>
}))

vi.mock('@/components/questions/FloatingActionBar', () => ({
  default: () => <div data-testid="floating-action-bar">Floating Action Bar</div>
}))

vi.mock('@/components/questions/QuestionCard', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="question-card">{children}</div>
}))

vi.mock('@/components/questions/ContentQuestion', () => ({
  default: ({ content, sharedContext, subQuestions }: any) => (
    <div data-testid="content-question">
      {content && <span>{content}</span>}
      {sharedContext && <span>{sharedContext}</span>}
      {subQuestions && subQuestions.map((sq: any, i: number) => (
        <span key={i}>{sq.content}</span>
      ))}
    </div>
  )
}))

// Mock API
vi.mock('@/lib/api', () => ({
  getQuestions: vi.fn(),
}))

describe('QuestionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', async () => {
    vi.spyOn(api, 'getQuestions').mockReturnValue(new Promise(() => {}))
    render(<QuestionsPage />)
    expect(screen.getAllByTestId('question-skeleton')[0]).toBeInTheDocument()
  })

  it('renders standalone single questions correctly', async () => {
    vi.spyOn(api, 'getQuestions').mockResolvedValue([
      {
        id: '1',
        book_name: 'Q1',
        type_question: 'single',
        content: 'Test content 1',
        type: 'Trắc nghiệm',
        grade: 10,
        topic: 'Đại số',
        difficulty_level: 'Thông hiểu',
        difficulty_point: 5,
        point: 1,
        tags: [],
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
        solution_guide: 'Solution 1',
        hint: '',
        quick_solve_tips: '',
        general_method: '',
        mistakes: '',
      },
    ])

    render(<QuestionsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Test content 1')).toBeInTheDocument()
    })
  })

  it('renders grouped questions correctly', async () => {
    vi.spyOn(api, 'getQuestions').mockResolvedValue([
      {
        id: '2',
        book_name: 'Group 1',
        type_question: 'group',
        content: 'Shared Context Content',
        type: 'Trắc nghiệm',
        grade: 10,
        topic: 'Hình học',
        difficulty_level: 'Vận dụng',
        difficulty_point: 8,
        point: 2,
        tags: [],
        options: [],
        correct_answer: '',
        solution_guide: '',
        hint: '',
        quick_solve_tips: '',
        general_method: '',
        mistakes: '',
        subQuestions: [
          {
            id: '3',
            type_question: 'single',
            content: 'Sub question 1',
            type: 'Trắc nghiệm',
            grade: 10,
            topic: 'Hình học',
            difficulty_level: 'Vận dụng',
            difficulty_point: 8,
            point: 1,
            tags: [],
            options: ['X', 'Y', 'Z'],
            correct_answer: 'X',
            solution_guide: 'Sol',
            hint: '',
            quick_solve_tips: '',
            general_method: '',
            mistakes: '',
          }
        ]
      },
    ])

    render(<QuestionsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Shared Context Content')).toBeInTheDocument()
      expect(screen.getByText('Sub question 1')).toBeInTheDocument()
    })
  })

  it('renders empty state when no questions found', async () => {
    vi.spyOn(api, 'getQuestions').mockResolvedValue([])

    render(<QuestionsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy câu hỏi')).toBeInTheDocument()
    })
  })
})

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ExamQuestionList from './ExamQuestionList'
import { Question } from '../../types/question'

describe('ExamQuestionList Component', () => {
  const mockQuestions: Question[] = [
    {
      id: 'q1',
      topic: 'Hàm số',
      difficulty_level: 'Nhận biết',
      type: 'Trắc nghiệm',
      type_question: 'single',
      grade: 12,
      content: 'Tìm tất cả các giá trị thực của tham số',
      options: ['A', 'B', 'C', 'D'],
      correct_answer: 'A',
      solution_guide: '',
      difficulty_point: 1,
      point: 1,
      tags: [],
      hint: '',
      quick_solve_tips: '',
      general_method: '',
      mistakes: '',
      image_question: null,
      image_solution: null,
    }
  ]

  it('renders section 1 and 2 titles', () => {
    render(<ExamQuestionList questions={mockQuestions} />)
    expect(screen.getByText('Phần 1: Trắc nghiệm')).toBeInTheDocument()
    expect(screen.getByText('Phần 2: Tự luận')).toBeInTheDocument()
  })

  it('renders question content', () => {
    render(<ExamQuestionList questions={mockQuestions} />)
    expect(screen.getByText(/Tìm tất cả các giá trị thực của tham số/i)).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ExamQuestionList from './ExamQuestionList'

describe('ExamQuestionList Component', () => {
  it('renders section 1 and 2 titles', () => {
    render(<ExamQuestionList />)
    expect(screen.getByText('Phần 1: Trắc nghiệm')).toBeInTheDocument()
    expect(screen.getByText('Phần 2: Tự luận')).toBeInTheDocument()
  })

  it('renders question content', () => {
    render(<ExamQuestionList />)
    expect(screen.getByText(/Tìm tất cả các giá trị thực của tham số/i)).toBeInTheDocument()
  })
})

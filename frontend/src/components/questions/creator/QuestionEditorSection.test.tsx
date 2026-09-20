import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import QuestionEditorSection from './QuestionEditorSection'

describe('QuestionEditorSection Component', () => {
  it('renders all editor sections for group question', () => {
    const mockQuestion = { type_question: 'group' } as any;
    render(<QuestionEditorSection currentQuestion={mockQuestion} currentBlock={{ is_group: true, questions: [mockQuestion], shared_content: 'Đoạn trích' }} />)
    expect(screen.getByText('Nội dung dẫn chung')).toBeInTheDocument()
    expect(screen.getByText('Nội dung câu hỏi')).toBeInTheDocument()
    expect(screen.getByText('Đáp án')).toBeInTheDocument()
    expect(screen.getByText('Lời giải chi tiết')).toBeInTheDocument()
    expect(screen.getByText('Thông tin bổ trợ cho học sinh')).toBeInTheDocument()
  })

  it('renders support fields', () => {
    render(<QuestionEditorSection />)
    expect(screen.getByText('Gợi ý')).toBeInTheDocument()
    expect(screen.getByText('Mẹo giải nhanh')).toBeInTheDocument()
    expect(screen.getByText('Phương pháp tổng quát')).toBeInTheDocument()
  })

  it('allows selecting correct answer by clicking radio button when option has content', () => {
    const updateQuestion = vi.fn()
    const mockQuestion = {
      type: 'Trắc nghiệm',
      options: ['Đáp án 1', 'Đáp án 2', 'Đáp án 3', 'Đáp án 4'],
      correct_answer: ''
    } as any

    render(<QuestionEditorSection currentQuestion={mockQuestion} updateQuestion={updateQuestion} />)
    
    const radioB = screen.getByRole('radio', { name: 'B.' })
    fireEvent.click(radioB)

    expect(updateQuestion).toHaveBeenCalledWith('correct_answer', 'Đáp án 2')
  })

  it('allows selecting correct answer by letter when options are empty', () => {
    const updateQuestion = vi.fn()
    const mockQuestion = {
      type: 'Trắc nghiệm',
      options: ['', '', '', ''],
      correct_answer: ''
    } as any

    render(<QuestionEditorSection currentQuestion={mockQuestion} updateQuestion={updateQuestion} />)
    
    const radioC = screen.getByRole('radio', { name: 'C.' })
    fireEvent.click(radioC)

    expect(updateQuestion).toHaveBeenCalledWith('correct_answer', 'C')
  })

  it('correctly identifies selected option when correct_answer is letter B', () => {
    const mockQuestion = {
      type: 'Trắc nghiệm',
      options: ['Opt A', 'Opt B', 'Opt C', 'Opt D'],
      correct_answer: 'B'
    } as any

    render(<QuestionEditorSection currentQuestion={mockQuestion} />)
    
    const radioB = screen.getByRole('radio', { name: 'B.' }) as HTMLInputElement
    expect(radioB.checked).toBe(true)

    const radioA = screen.getByRole('radio', { name: 'A.' }) as HTMLInputElement
    expect(radioA.checked).toBe(false)
  })

  it('correctly identifies selected option when correct_answer matches option text', () => {
    const mockQuestion = {
      type: 'Trắc nghiệm',
      options: ['Opt A', 'Opt B', 'Opt C', 'Opt D'],
      correct_answer: 'Opt C'
    } as any

    render(<QuestionEditorSection currentQuestion={mockQuestion} />)
    
    const radioC = screen.getByRole('radio', { name: 'C.' }) as HTMLInputElement
    expect(radioC.checked).toBe(true)
  })
})

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

  it('renders support fields with math formula buttons', () => {
    render(<QuestionEditorSection />)
    expect(screen.getByText('Gợi ý')).toBeInTheDocument()
    expect(screen.getByText('Lời giải ngắn')).toBeInTheDocument()
    expect(screen.getByText('Phương pháp tổng quát')).toBeInTheDocument()
    expect(screen.getByText('Lỗi thường gặp')).toBeInTheDocument()
    const mathButtons = screen.getAllByTitle(/công thức toán/i)
    expect(mathButtons.length).toBeGreaterThanOrEqual(4)
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

  it('renders essay answer editor when question type is Tự luận without label text', () => {
    const mockQuestion = {
      type: 'Tự luận',
      options: [],
      correct_answer: ''
    } as any

    const { container } = render(<QuestionEditorSection currentQuestion={mockQuestion} />)
    
    expect(container.querySelector('.bg-slate-50')).toBeInTheDocument()
    expect(screen.queryByText('Đáp án / Lời giải mẫu tự luận')).not.toBeInTheDocument()
    expect(screen.queryByText(/Hỗ trợ công thức KaTeX/i)).not.toBeInTheDocument()
  })

  it('renders component dẫn chung when shared_content has text even if is_group is not set', () => {
    const mockQuestion = {
      type: 'Trắc nghiệm',
      options: ['A', 'B', 'C', 'D'],
    } as any
    const mockBlock = {
      shared_content: 'Đoạn trích văn bản dẫn chung',
      questions: [mockQuestion]
    } as any

    render(<QuestionEditorSection currentQuestion={mockQuestion} currentBlock={mockBlock} />)
    
    expect(screen.getByText('Nội dung dẫn chung')).toBeInTheDocument()
  })

  it('renders freeform solution guide editor with formatted content', () => {
    const mockQuestion = {
      type: 'Tự luận',
      solution_guide: {
        steps: [
          { step: 1, title: 'Bước 1', content: 'Tìm x', point: 0.5 }
        ],
        conclusion: 'Xong'
      }
    } as any

    render(<QuestionEditorSection currentQuestion={mockQuestion} />)

    expect(screen.getByText('Lời giải chi tiết')).toBeInTheDocument()
    expect(screen.queryByText('Từng bước (có điểm)')).not.toBeInTheDocument()
  })

  it('renders illustration card above solution guide with shared diagram for group question', () => {
    const mockQuestion = {
      id: '1',
      content: 'Câu 1a',
      type: 'Tự luận',
      options: [],
      solution_guide: 'Lời giải câu a'
    } as any

    const mockBlock = {
      is_group: true,
      diagram_svg: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /></svg>',
      questions: [mockQuestion, { id: '2', content: 'Câu 1b', type: 'Tự luận' }],
      shared_content: 'Đoạn trích'
    } as any

    render(<QuestionEditorSection currentQuestion={mockQuestion} currentBlock={mockBlock} />)

    expect(screen.getByText('Hình vẽ minh họa bài toán')).toBeInTheDocument()
    const img = screen.getByAltText('Hình vẽ minh họa bài toán')
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('src')).toContain('data:image/svg+xml;utf8,')
  })
})


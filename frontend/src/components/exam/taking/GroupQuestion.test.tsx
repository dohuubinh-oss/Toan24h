import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import GroupQuestion from './GroupQuestion'
import userEvent from '@testing-library/user-event'

describe('GroupQuestion Component', () => {
  const subQuestions = [
    {
      id: 1,
      type: 'mc' as const,
      content: 'Câu hỏi 1?',
      options: [
        { id: 'A', text: 'A' },
        { id: 'B', text: 'B' },
      ],
    },
    {
      id: 2,
      type: 'essay' as const,
      content: 'Câu hỏi 2?',
    }
  ]

  const answers = {
    1: 'A',
    2: 'Đáp án 2'
  }

  it('renders context and sub-questions correctly', () => {
    render(
      <GroupQuestion
        id={100}
        sharedContext="Đọc đoạn văn sau:"
        subQuestions={subQuestions}
        answers={answers}
        onAnswerChange={vi.fn()}
      />
    )
    
    // Context
    expect(screen.getByText('Đọc đoạn văn sau:')).toBeInTheDocument()
    
    // Sub-question 1 (MC)
    expect(screen.getByText('Câu hỏi 1?')).toBeInTheDocument()
    // It renders the ID in a separate div and text in another div
    expect(screen.getAllByText('A').length).toBeGreaterThan(0)
    
    // Sub-question 2 (Essay)
    expect(screen.getByText('Câu hỏi 2?')).toBeInTheDocument()
  })

  it('calls onAnswerChange correctly', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()
    
    render(
      <GroupQuestion
        id={100}
        sharedContext="Đọc đoạn văn sau:"
        subQuestions={subQuestions}
        answers={answers}
        onAnswerChange={handleChange}
      />
    )
    
    const options = screen.getAllByText('B')
    // Click the label or div for B
    await user.click(options[options.length - 1])
    
    expect(handleChange).toHaveBeenCalledWith(1, 'B')
  })
})

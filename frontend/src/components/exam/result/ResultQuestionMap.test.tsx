import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResultQuestionMap from './ResultQuestionMap'

describe('ResultQuestionMap Component', () => {
  const mcQuestions = [
    { id: 1, isCorrect: true, type: 'mc' as const },
    { id: 2, isCorrect: false, type: 'mc' as const },
  ]
  const essayQuestions = [
    { id: 11, score: 1.0, type: 'essay' as const, isWarning: false },
    { id: 12, score: 0.5, type: 'essay' as const, isWarning: true },
  ]

  it('renders question map properly', () => {
    render(
      <ResultQuestionMap 
        mcQuestions={mcQuestions}
        essayQuestions={essayQuestions}
        totalQuestions={4}
        onSelectQuestion={vi.fn()}
      />
    )
    
    expect(screen.getByText('Bản đồ câu hỏi')).toBeInTheDocument()
    expect(screen.getByText('4 Câu hỏi')).toBeInTheDocument()
    
    // Check multiple choice
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    
    // Check essay
    expect(screen.getByText('11')).toBeInTheDocument()
    expect(screen.getByText('(1.0đ)')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('(0.5đ)')).toBeInTheDocument()
  })

  it('calls onSelectQuestion when clicked', async () => {
    const handleSelect = vi.fn()
    const user = userEvent.setup()
    
    render(
      <ResultQuestionMap 
        mcQuestions={mcQuestions}
        essayQuestions={essayQuestions}
        totalQuestions={4}
        onSelectQuestion={handleSelect}
      />
    )
    
    const btn = screen.getByText('11')
    await user.click(btn)
    
    expect(handleSelect).toHaveBeenCalledWith(11)
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuestionMapSidebar from './QuestionMapSidebar'

describe('QuestionMapSidebar Component', () => {
  const questions = [
    { id: 1, status: 'done' as const, isFlagged: false },
    { id: 2, status: 'current' as const, isFlagged: false },
    { id: 3, status: 'unfinished' as const, isFlagged: true },
    { id: 4, status: 'unfinished' as const, isFlagged: false },
  ]

  it('renders correctly and toggles open/close', async () => {
    const user = userEvent.setup()
    render(<QuestionMapSidebar questions={questions} onSelectQuestion={vi.fn()} onSubmit={vi.fn()} />)
    
    // Default is closed, but it should still be in DOM
    expect(screen.getByText('Bản đồ câu hỏi')).toBeInTheDocument()
    
    // Toggle button should be present
    const openBtn = screen.getByTestId('qmap-toggle-btn')
    expect(openBtn).toBeInTheDocument()
    
    await user.click(openBtn)
    
    // It should render questions
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('calls onSelectQuestion when a question is clicked', async () => {
    const handleSelect = vi.fn()
    const user = userEvent.setup()
    
    render(<QuestionMapSidebar questions={questions} onSelectQuestion={handleSelect} onSubmit={vi.fn()} />)
    
    await user.click(screen.getByText('3'))
    expect(handleSelect).toHaveBeenCalledWith(3)
  })

  it('calls onSubmit when submit button is clicked', async () => {
    const handleSubmit = vi.fn()
    const user = userEvent.setup()
    
    render(<QuestionMapSidebar questions={questions} onSelectQuestion={vi.fn()} onSubmit={handleSubmit} />)
    
    const submitBtn = screen.getByRole('button', { name: /Nộp bài ngay/i })
    await user.click(submitBtn)
    expect(handleSubmit).toHaveBeenCalledTimes(1)
  })
})

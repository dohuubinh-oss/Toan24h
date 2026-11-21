import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import HomeAiAssistantButton from './HomeAiAssistantButton'

describe('HomeAiAssistantButton Component', () => {
  it('renders floating action button with accessible label', () => {
    render(<HomeAiAssistantButton />)
    const fab = screen.getByRole('button', { name: /Trợ lý AI Toán học/i })
    expect(fab).toBeInTheDocument()
  })

  it('opens AI assistant modal when clicked and shows math prompt chips', () => {
    render(<HomeAiAssistantButton />)
    const fab = screen.getByRole('button', { name: /Trợ lý AI Toán học/i })
    fireEvent.click(fab)

    expect(screen.getByText(/Trợ lý Toán học MathAI/i)).toBeInTheDocument()
    expect(screen.getByText(/Cách giải nhanh phương trình bậc hai bằng Hệ thức Viète/i)).toBeInTheDocument()
    expect(screen.getByText(/Phương pháp tách phân số quy luật Lớp 5 & 6/i)).toBeInTheDocument()
  })

  it('selects a prompt chip and displays solution breakdown with action links', () => {
    render(<HomeAiAssistantButton />)
    fireEvent.click(screen.getByRole('button', { name: /Trợ lý AI Toán học/i }))

    const vieteChip = screen.getByRole('button', {
      name: /Cách giải nhanh phương trình bậc hai bằng Hệ thức Viète/i,
    })
    fireEvent.click(vieteChip)

    // Displays solution explanation
    expect(screen.getByText(/x_1 \+ x_2 = -b\/a/i)).toBeInTheDocument()

    // Has action links to explore lectures and practice
    const lectureLink = screen.getByRole('link', { name: /Xem bài giảng chuyên đề/i })
    expect(lectureLink).toHaveAttribute('href', '/lectures')
  })

  it('closes modal when clicking close button', () => {
    render(<HomeAiAssistantButton />)
    fireEvent.click(screen.getByRole('button', { name: /Trợ lý AI Toán học/i }))
    expect(screen.getByText(/Trợ lý Toán học MathAI/i)).toBeInTheDocument()

    const closeBtn = screen.getByRole('button', { name: /Đóng/i })
    fireEvent.click(closeBtn)

    expect(screen.queryByText(/Trợ lý Toán học MathAI/i)).not.toBeInTheDocument()
  })
})

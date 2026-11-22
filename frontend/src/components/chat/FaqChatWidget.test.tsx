import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import FaqChatWidget from './FaqChatWidget'
import * as api from '@/lib/api'

// Mock next/navigation
let mockPathname = '/'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

describe('FaqChatWidget', () => {
  beforeEach(() => {
    mockPathname = '/'
    vi.clearAllMocks()
  })

  it('renders trigger button on regular pages', () => {
    render(<FaqChatWidget />)
    const button = screen.getByRole('button', { name: /hỏi đáp ai/i })
    expect(button).toBeInTheDocument()
  })

  it('hides completely inside active exam room', () => {
    mockPathname = '/exam/abc-123/take'
    render(<FaqChatWidget />)
    expect(screen.queryByRole('button', { name: /hỏi đáp ai/i })).not.toBeInTheDocument()
  })

  it('opens chat window on click', () => {
    render(<FaqChatWidget />)
    const button = screen.getByRole('button', { name: /hỏi đáp ai/i })
    fireEvent.click(button)

    expect(screen.getByText('Trợ lý AI toan6789.vn')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/nhập câu hỏi của bạn/i)).toBeInTheDocument()
  })

  it('sends question and displays answer from api', async () => {
    vi.spyOn(api, 'sendFaqChatMessage').mockResolvedValueOnce({
      answer: 'Gói VIP 1 tháng có giá 199k.',
      sources: [{ id: '1', question: 'Giá gói', category: 'pricing' }],
    })

    render(<FaqChatWidget />)
    fireEvent.click(screen.getByRole('button', { name: /hỏi đáp ai/i }))

    const input = screen.getByPlaceholderText(/nhập câu hỏi của bạn/i)
    fireEvent.change(input, { target: { value: 'Giá VIP bao nhiêu?' } })

    const sendBtn = screen.getByRole('button', { name: /gửi câu hỏi/i })
    fireEvent.click(sendBtn)

    await waitFor(() => {
      expect(screen.getByText('Gói VIP 1 tháng có giá 199k.')).toBeInTheDocument()
    })
  })
})

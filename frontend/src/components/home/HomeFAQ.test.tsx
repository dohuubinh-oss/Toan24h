import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import HomeFAQ from './HomeFAQ'

describe('HomeFAQ Component', () => {
  it('renders section heading directly without banned eyebrows', () => {
    render(<HomeFAQ />)
    const heading = screen.getByRole('heading', { level: 2, name: /Câu hỏi thường gặp của phụ huynh & học sinh/i })
    expect(heading).toBeInTheDocument()
  })

  it('renders the 4 core product questions', () => {
    render(<HomeFAQ />)
    expect(screen.getByText(/Tại sao mỗi tài khoản lại chỉ giới hạn trong một khối lớp đăng ký\?/i)).toBeInTheDocument()
    expect(screen.getByText(/Làm thế nào để phụ huynh nhận được thông báo học tập qua Telegram\?/i)).toBeInTheDocument()
    expect(screen.getByText(/Chính sách cam kết hoàn tiền trong 7 ngày hoạt động như thế nào\?/i)).toBeInTheDocument()
    expect(screen.getByText(/Phương thức thanh toán VietQR Napas có kích hoạt tự động không\?/i)).toBeInTheDocument()
  })

  it('toggles accordion items on click with aria-expanded update', () => {
    render(<HomeFAQ />)
    const firstQuestionBtn = screen.getByRole('button', {
      name: /Tại sao mỗi tài khoản lại chỉ giới hạn trong một khối lớp đăng ký\?/i,
    })

    // Initially collapsed
    expect(firstQuestionBtn).toHaveAttribute('aria-expanded', 'false')

    // Click to open
    fireEvent.click(firstQuestionBtn)
    expect(firstQuestionBtn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/cá nhân hóa lộ trình học và hệ thống bài tập bám sát đúng chương trình GDPT/i)).toBeInTheDocument()

    // Click again to close
    fireEvent.click(firstQuestionBtn)
    expect(firstQuestionBtn).toHaveAttribute('aria-expanded', 'false')
  })
})

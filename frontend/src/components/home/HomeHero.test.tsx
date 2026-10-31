import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import HomeHero from './HomeHero'

describe('HomeHero', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders hero content with new headline and default grade 9 exam card', () => {
    render(<HomeHero />)
    expect(screen.getByText(/Luyện Toán thông minh, bứt phá/i)).toBeInTheDocument()
    expect(screen.getByText(/điểm 9\+/i)).toBeInTheDocument()
    expect(screen.getByText(/Chương trình chuẩn Bộ Giáo dục từ lớp 5 đến lớp 9/i)).toBeInTheDocument()
    expect(screen.getByText('Bắt đầu')).toBeInTheDocument()
    expect(screen.getByText('Xem demo')).toBeInTheDocument()
    expect(screen.getByText(/Thi thử vào 10 • Toán 9/i)).toBeInTheDocument()
    expect(screen.getByText('Học ngay')).toBeInTheDocument()
    expect(screen.getByText(/90 phút/i)).toBeInTheDocument()
  })

  it('switches exam card content when clicking different grade pills including Grade 5', () => {
    render(<HomeHero />)
    const grade5Btn = screen.getByRole('button', { name: /Lớp 5/i })
    fireEvent.click(grade5Btn)

    expect(screen.getByText(/Toán 5 • Luyện thi vào 6 CLC/i)).toBeInTheDocument()
    expect(screen.getByText(/Đề thi khảo sát năng lực Toán vào Lớp 6 Chất lượng cao/i)).toBeInTheDocument()
    expect(screen.getByText(/45 phút/i)).toBeInTheDocument()

    const grade6Btn = screen.getByRole('button', { name: /Lớp 6/i })
    fireEvent.click(grade6Btn)

    expect(screen.getByText(/Toán 6 • Khảo sát định kỳ/i)).toBeInTheDocument()
    expect(screen.getByText(/Đề kiểm tra chất lượng giữa kì II - Toán 6/i)).toBeInTheDocument()
    expect(screen.getByText(/60 phút/i)).toBeInTheDocument()
  })

  it('auto-selects grade from logged in student in localStorage', () => {
    localStorage.setItem('user', JSON.stringify({ fullName: 'Nguyễn Văn An', grade: '8' }))
    render(<HomeHero />)

    expect(screen.getByText(/Toán 8 • Nâng cao điểm số/i)).toBeInTheDocument()
    expect(screen.getByText(/Đề thi thử học kỳ & phân loại kiến thức - Toán 8/i)).toBeInTheDocument()
    expect(screen.getByText(/Chào An!/i)).toBeInTheDocument()
  })

  it('opens and closes YouTube demo video modal', () => {
    render(<HomeHero />)
    const demoBtn = screen.getByRole('button', { name: /Xem demo/i })
    fireEvent.click(demoBtn)

    expect(screen.getByRole('dialog', { name: /Video giới thiệu/i })).toBeInTheDocument()
    expect(screen.getByTitle('Video giới thiệu toan6789.vn')).toHaveAttribute(
      'src',
      expect.stringContaining('2wCZ5F6oNz0')
    )

    const closeBtn = screen.getByRole('button', { name: /Đóng video/i })
    fireEvent.click(closeBtn)

    expect(screen.queryByRole('dialog', { name: /Video giới thiệu/i })).not.toBeInTheDocument()
  })
})

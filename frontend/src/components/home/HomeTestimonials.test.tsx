import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import HomeTestimonials from './HomeTestimonials'

describe('HomeTestimonials Component', () => {
  it('renders section heading directly without eyebrow/kicker', () => {
    render(<HomeTestimonials />)
    const heading = screen.getByRole('heading', { level: 2, name: /Đồng hành cùng hơn 12\.000 học sinh bứt phá điểm số/i })
    expect(heading).toBeInTheDocument()
  })

  it('renders 3 authentic student & parent testimonials', () => {
    render(<HomeTestimonials />)
    // Student 1: Hoang Nam (Lop 9 vao 10 Chuyen)
    expect(screen.getByText(/Hoàng Nam/i)).toBeInTheDocument()
    expect(screen.getByText(/Đỗ Chuyên Sư Phạm Hà Nội/i)).toBeInTheDocument()
    expect(screen.getByText(/9\.25 điểm Toán vào 10/i)).toBeInTheDocument()

    // Parent 2: Chi Mai Huong (Phu huynh Lop 7)
    expect(screen.getByText(/Chị Mai Hương/i)).toBeInTheDocument()
    expect(screen.getByText(/Phụ huynh bé Tuấn Kiệt/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Báo cáo Telegram/i).length).toBeGreaterThan(0)

    // Student 3: Le Minh Chau (Lop 5 vao 6 CLC)
    expect(screen.getByText(/Lê Minh Châu/i)).toBeInTheDocument()
    expect(screen.getByText(/Đỗ Lớp 6 CLC Cầu Giấy/i)).toBeInTheDocument()
  })

  it('renders rating stars with accessible semantic markup', () => {
    render(<HomeTestimonials />)
    const ratingGroups = screen.getAllByLabelText(/Đánh giá 5\/5 sao/i)
    expect(ratingGroups.length).toBe(3)
  })
})

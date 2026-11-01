import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AboutPage from './page'

describe('AboutPage', () => {
  it('renders hero title and mission statement', () => {
    render(<AboutPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Về Chúng Tôi & Chương Trình Đối Tác Affiliate 30%/i })
    ).toBeInTheDocument()

    expect(screen.getByText(/Biến Môn Toán THCS Trở Nên Trực Quan & Dễ Tiếp Cận Cho Mọi Học Sinh/i)).toBeInTheDocument()
    expect(screen.getByText(/Đội Ngũ Giáo Viên Chuyên Toán Chấm Chữa Tận Tâm/i)).toBeInTheDocument()
    expect(screen.queryByText(/Trợ Lý MathAI/i)).not.toBeInTheDocument()
  })

  it('renders Affiliate section with only 30% commission policy', () => {
    render(<AboutPage />)

    expect(screen.getByText(/30% Hoa Hồng/i)).toBeInTheDocument()
    expect(screen.getByText(/Tỷ lệ 30% trọn đời/i)).toBeInTheDocument()

    // Assert that internal tiers are NOT exposed
    expect(screen.queryByText(/50%/)).not.toBeInTheDocument()
    expect(screen.queryByText(/60%/)).not.toBeInTheDocument()
    expect(screen.queryByText(/1% sàn/)).not.toBeInTheDocument()
    expect(screen.queryByText(/3% khối/)).not.toBeInTheDocument()
  })

  it('calculates estimated commission interactively when changing package and slider', () => {
    render(<AboutPage />)

    // Default package is 3 months (675.000đ) with 10 students:
    // Total revenue = 6.750.000đ, 30% commission = 2.025.000 VNĐ
    expect(screen.getByText(/2\.025\.000/)).toBeInTheDocument()

    // Switch to 1 month package (300.000đ)
    const oneMonthBtn = screen.getByRole('button', { name: /Gói 1 Tháng/i })
    fireEvent.click(oneMonthBtn)

    // With 10 students, total revenue = 3.000.000đ, 30% commission = 900.000 VNĐ
    expect(screen.getByText(/900\.000/)).toBeInTheDocument()

    // Change slider to 20 students
    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '20' } })

    // With 20 students, total revenue = 6.000.000đ, 30% commission = 1.800.000 VNĐ
    expect(screen.getByText(/1\.800\.000/)).toBeInTheDocument()
  })

  it('allows expanding and collapsing FAQ items', () => {
    render(<AboutPage />)

    const faqButton = screen.getByRole('button', {
      name: /Chương trình Affiliate toan6789\.vn là gì\?/i,
    })
    expect(faqButton).toBeInTheDocument()

    // Initially collapsed
    expect(screen.queryByText(/Đây là chương trình hợp tác chia sẻ doanh thu/i)).not.toBeInTheDocument()

    // Click to expand
    fireEvent.click(faqButton)
    expect(screen.getByText(/Đây là chương trình hợp tác chia sẻ doanh thu/i)).toBeInTheDocument()

    // Click again to collapse
    fireEvent.click(faqButton)
    expect(screen.queryByText(/Đây là chương trình hợp tác chia sẻ doanh thu/i)).not.toBeInTheDocument()
  })
})

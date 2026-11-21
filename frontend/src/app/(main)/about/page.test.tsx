import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AboutPage from './page'

describe('AboutPage', () => {
  it('renders hero title and mission statement', () => {
    render(<AboutPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Về Chúng Tôi & Sứ Mệnh Kiến Tạo Toán Học THCS/i })
    ).toBeInTheDocument()

    expect(screen.getByText(/Biến Môn Toán THCS Trở Nên Trực Quan & Dễ Tiếp Cận Cho Mọi Học Sinh/i)).toBeInTheDocument()
    expect(screen.getByText(/Đội Ngũ Giáo Viên Chuyên Toán Chấm Chữa Tận Tâm/i)).toBeInTheDocument()
    expect(screen.getByText(/Lộ Trình 3 Bước Bứt Phá Điểm Số Cùng toan6789\.vn/i)).toBeInTheDocument()
  })

  it('does not render any affiliate or commission content', () => {
    render(<AboutPage />)

    // Ensure completely free of affiliate/commission references
    expect(screen.queryByText(/Affiliate/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Hoa hồng/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Đối tác/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/30%/)).not.toBeInTheDocument()
    expect(screen.queryByText(/rút tiền/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
  })

  it('allows expanding and collapsing FAQ items', () => {
    render(<AboutPage />)

    const faqButton = screen.getByRole('button', {
      name: /toan6789\.vn cung cấp những dịch vụ giáo dục gì\?/i,
    })
    expect(faqButton).toBeInTheDocument()

    // Initially collapsed
    expect(
      screen.queryByText(/toan6789\.vn cung cấp các Khóa học trực tuyến, Dịch vụ hỗ trợ giáo dục/i)
    ).not.toBeInTheDocument()

    // Click to expand
    fireEvent.click(faqButton)
    expect(
      screen.getByText(/toan6789\.vn cung cấp các Khóa học trực tuyến, Dịch vụ hỗ trợ giáo dục/i)
    ).toBeInTheDocument()

    // Click again to collapse
    fireEvent.click(faqButton)
    expect(
      screen.queryByText(/toan6789\.vn cung cấp các Khóa học trực tuyến, Dịch vụ hỗ trợ giáo dục/i)
    ).not.toBeInTheDocument()
  })
})

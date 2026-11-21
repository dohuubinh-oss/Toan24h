import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import HomeFooter from './HomeFooter'

describe('HomeFooter', () => {
  it('renders footer section', () => {
    render(<HomeFooter />)
    expect(screen.getByText(/toan6789\.vn/i)).toBeInTheDocument()
    expect(screen.getByText('Về chúng tôi')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Điều khoản dịch vụ & Chính sách/i })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: /Chính sách bảo mật dữ liệu/i })).toHaveAttribute('href', '/privacy')
    expect(screen.getByText(/Khóa học trực tuyến & Dịch vụ hỗ trợ giáo dục/i)).toBeInTheDocument()
  })
})

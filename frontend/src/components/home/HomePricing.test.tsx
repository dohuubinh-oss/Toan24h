import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import HomePricing from './HomePricing'

describe('HomePricing Component', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders the 2 pricing options correctly', () => {
    render(<HomePricing />)
    expect(screen.getByRole('heading', { name: /Chọn Gói Học Phù Hợp Với Bạn/i })).toBeInTheDocument()
    expect(screen.getByText('Gói 3 Tháng')).toBeInTheDocument()
    expect(screen.getByText('Gói 1 Năm')).toBeInTheDocument()
    expect(screen.getByText('PHỔ BIẾN NHẤT')).toBeInTheDocument()
    expect(screen.getByText('TIẾT KIỆM NHẤT')).toBeInTheDocument()
    expect(screen.getByText('675.000đ')).toBeInTheDocument()
    expect(screen.getByText('1.800.000đ')).toBeInTheDocument()
  })

  it('renders upgrade account links pointing to /upgrade', () => {
    render(<HomePricing />)
    const links = screen.getAllByRole('link', { name: /Nâng cấp tài khoản/i })
    expect(links.length).toBe(2)
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', '/upgrade')
    })
  })

  it('renders parent trust banner with Telegram reporting and VietQR activation', () => {
    render(<HomePricing />)
    expect(screen.getByText(/An tâm đồng hành cùng phụ huynh & học sinh/i)).toBeInTheDocument()
    expect(screen.getByText(/Kích hoạt VietQR tức thì trong 3s/i)).toBeInTheDocument()
    expect(screen.getByText(/Báo cáo Telegram cho phụ huynh/i)).toBeInTheDocument()
    expect(screen.getByText(/Cam kết bảo đảm chất lượng/i)).toBeInTheDocument()
  })

  it('does not render digital goods / software terms or intrusive tax disclaimer', () => {
    render(<HomePricing />)
    // Must NOT contain digital software / goods keywords
    expect(screen.queryByText(/bán phần mềm/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/tài liệu số/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/sản phẩm số/i)).not.toBeInTheDocument()
    // Tax policy is kept in /terms, not cluttering home pricing
    expect(screen.queryByText(/không chịu thuế GTGT/i)).not.toBeInTheDocument()
  })
})

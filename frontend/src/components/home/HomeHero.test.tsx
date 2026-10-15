import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import HomeHero from './HomeHero'

describe('HomeHero', () => {
  it('renders hero content', () => {
    render(<HomeHero />)
    expect(screen.getByText(/Luyện Toán thông minh/i)).toBeInTheDocument()
    expect(screen.getByText(/điểm 9\+/i)).toBeInTheDocument()
    expect(screen.getByText(/Chương trình chuẩn Bộ Giáo dục/i)).toBeInTheDocument()
    expect(screen.getByText('Bắt đầu miễn phí')).toBeInTheDocument()
    expect(screen.getByText('Xem demo')).toBeInTheDocument()
  })
})

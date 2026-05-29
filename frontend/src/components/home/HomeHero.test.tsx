import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import HomeHero from './HomeHero'

describe('HomeHero', () => {
  it('renders hero content', () => {
    render(<HomeHero />)
    expect(screen.getByText(/Học Toán không còn khó/i)).toBeInTheDocument()
    expect(screen.getByText(/Chương trình chuẩn Bộ Giáo dục/i)).toBeInTheDocument()
    expect(screen.getByText('Bắt đầu miễn phí')).toBeInTheDocument()
    expect(screen.getByText('Xem demo')).toBeInTheDocument()
  })
})

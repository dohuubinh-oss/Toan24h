import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import HomeFeatures from './HomeFeatures'

describe('HomeFeatures', () => {
  it('renders features section', () => {
    render(<HomeFeatures />)
    expect(screen.getByText('Tại sao chọn chúng tôi?')).toBeInTheDocument()
    expect(screen.getByText('Gia sư AI 24/7')).toBeInTheDocument()
    expect(screen.getByText('Học tập Game hóa')).toBeInTheDocument()
    expect(screen.getByText('Bám sát lộ trình Bộ GD')).toBeInTheDocument()
  })
})

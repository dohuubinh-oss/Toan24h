import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import HomeFooter from './HomeFooter'

describe('HomeFooter', () => {
  it('renders footer section', () => {
    render(<HomeFooter />)
    expect(screen.getByText(/toan6789\.vn/i)).toBeInTheDocument()
    expect(screen.getByText('Về chúng tôi')).toBeInTheDocument()
  })
})

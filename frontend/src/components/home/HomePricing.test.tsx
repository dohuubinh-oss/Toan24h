import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import HomePricing from './HomePricing'

describe('HomePricing', () => {
  it('renders pricing section', () => {
    render(<HomePricing />)
    expect(screen.getByText('Lựa chọn gói học phù hợp')).toBeInTheDocument()
    expect(screen.getByText('Gói Cơ Bản')).toBeInTheDocument()
    expect(screen.getByText('Gói Pro')).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoginBranding from './LoginBranding'

describe('LoginBranding Component', () => {
  it('renders branding elements', () => {
    render(<LoginBranding />)
    expect(screen.getByText('Chào mừng bạn trở lại!')).toBeInTheDocument()
    expect(screen.getByText(/Cùng chinh phục môn Toán mỗi ngày/i)).toBeInTheDocument()
    // It should have an image
    expect(screen.getByRole('img', { name: /Math Education Illustration/i })).toBeInTheDocument()
  })
})

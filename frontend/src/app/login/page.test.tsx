import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LoginPage from './page'

vi.mock('../../components/auth/LoginBranding', () => ({
  default: () => <div data-testid="login-branding-mock">LoginBranding</div>
}))

vi.mock('../../components/auth/LoginForm', () => ({
  default: () => <div data-testid="login-form-mock">LoginForm</div>
}))

describe('LoginPage', () => {
  it('renders both branding and form components', () => {
    render(<LoginPage />)
    expect(screen.getByTestId('login-branding-mock')).toBeInTheDocument()
    expect(screen.getByTestId('login-form-mock')).toBeInTheDocument()
  })
})

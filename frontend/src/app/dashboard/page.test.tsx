import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Home from './page'

// Mock the framer-motion components to avoid issues with animations in jsdom
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Plus: () => <span data-testid="icon-plus" />,
  Search: () => <span data-testid="icon-search" />,
  FileText: () => <span data-testid="icon-file-text" />,
  Settings: () => <span data-testid="icon-settings" />,
  Database: () => <span data-testid="icon-database" />,
}))

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    const heading = screen.getByText('ExamModel Hub')
    expect(heading).toBeInTheDocument()
  })

  it('renders the new assessment button', () => {
    render(<Home />)
    const button = screen.getByText('New Assessment')
    expect(button).toBeInTheDocument()
  })
})

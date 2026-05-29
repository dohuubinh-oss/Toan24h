import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StudentTopics from './StudentTopics'

describe('StudentTopics Component', () => {
  it('renders topic list', () => {
    render(<StudentTopics />)
    expect(screen.getByText(/Đại số/i)).toBeInTheDocument()
    expect(screen.getByText(/Hình học/i)).toBeInTheDocument()
    expect(screen.getByText(/Giải tích/i)).toBeInTheDocument()
  })

  it('renders continue buttons for topics', () => {
    render(<StudentTopics />)
    const buttons = screen.getAllByRole('button', { name: /Tiếp tục/i })
    expect(buttons.length).toBeGreaterThan(0)
  })
})

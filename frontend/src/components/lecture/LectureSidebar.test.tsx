import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LectureSidebar from './LectureSidebar'

describe('LectureSidebar', () => {
  it('renders related lessons section', () => {
    render(<LectureSidebar />)
    expect(screen.getByText('Bài giảng liên quan')).toBeDefined()
    expect(screen.getByText('Xem tất cả bài giảng')).toBeDefined()
  })
})

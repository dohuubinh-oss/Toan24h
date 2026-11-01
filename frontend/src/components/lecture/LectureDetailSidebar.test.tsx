import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LectureDetailSidebar from './LectureDetailSidebar'

describe('LectureDetailSidebar', () => {
  it('renders related lessons section', () => {
    render(<LectureDetailSidebar />)
    expect(screen.getByText('Bài giảng liên quan')).toBeDefined()
    expect(screen.getByText('Xem tất cả bài giảng')).toBeDefined()
  })
})

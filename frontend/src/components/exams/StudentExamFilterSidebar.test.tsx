import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StudentExamFilterSidebar } from './StudentExamFilterSidebar'

describe('StudentExamFilterSidebar Component', () => {
  it('renders progress card with completion percentage and count', () => {
    render(<StudentExamFilterSidebar totalCount={14} completedCount={7} />)

    expect(screen.getByText(/Tiến độ luyện đề/i)).toBeInTheDocument()
    // 7 / 14 = 50%
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText(/7 \/ 14 đề/i)).toBeInTheDocument()
  })

  it('handles 0 total exams gracefully without dividing by zero', () => {
    render(<StudentExamFilterSidebar totalCount={0} completedCount={0} />)

    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByText(/0 \/ 0 đề/i)).toBeInTheDocument()
  })

  it('does not render search input or milestone filters inside sidebar', () => {
    render(<StudentExamFilterSidebar totalCount={10} completedCount={5} />)

    expect(screen.queryByPlaceholderText(/Tìm kiếm đề thi/i)).not.toBeInTheDocument()
    expect(screen.queryByText('CHẶNG ĐỀ THI')).not.toBeInTheDocument()
    expect(screen.queryByText('TRẠNG THÁI ĐỀ THI')).not.toBeInTheDocument()
  })
})

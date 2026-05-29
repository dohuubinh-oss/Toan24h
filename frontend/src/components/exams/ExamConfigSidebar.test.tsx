import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ExamConfigSidebar from './ExamConfigSidebar'

describe('ExamConfigSidebar Component', () => {
  it('renders config form elements', () => {
    render(<ExamConfigSidebar />)
    expect(screen.getByText('Tên đề thi')).toBeInTheDocument()
    expect(screen.getByText('Khối lớp')).toBeInTheDocument()
    expect(screen.getByText('Thời gian (phút)')).toBeInTheDocument()
  })

  it('renders matrix table', () => {
    render(<ExamConfigSidebar />)
    expect(screen.getByText('Ma trận đề thi')).toBeInTheDocument()
    expect(screen.getByText('Tổng cộng')).toBeInTheDocument()
  })
})

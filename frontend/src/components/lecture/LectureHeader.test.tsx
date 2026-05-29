import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LectureHeader from './LectureHeader'

describe('LectureHeader', () => {
  it('renders breadcrumbs', () => {
    render(<LectureHeader />)
    expect(screen.getByText('Trang chủ')).toBeDefined()
    expect(screen.getAllByText('Hình học lớp 12')[0]).toBeDefined()
    expect(screen.getByText('Thể tích khối chóp')).toBeDefined()
  })

  it('renders lecture title', () => {
    render(<LectureHeader />)
    expect(screen.getByText('Chuyên đề: Thể tích khối chóp và các bài toán thực tế nâng cao')).toBeDefined()
  })

  it('renders teacher and metadata', () => {
    render(<LectureHeader />)
    expect(screen.getByText('Thầy Nguyễn Văn A')).toBeDefined()
    expect(screen.getByText('15 Tháng 5, 2024')).toBeDefined()
    // It should render category
    expect(screen.getByText('Hình học lớp 12', { selector: 'span' })).toBeDefined() 
  })
})

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LectureSidebar from './LectureSidebar'

describe('LectureSidebar', () => {
  it('renders action buttons', () => {
    render(<LectureSidebar />)
    expect(screen.getByText('Tải tài liệu PDF')).toBeDefined()
    expect(screen.getByText('Lưu bài viết')).toBeDefined()
  })

  it('renders related lessons section', () => {
    render(<LectureSidebar />)
    expect(screen.getByText('Bài giảng liên quan')).toBeDefined()
    expect(screen.getByText('Xem tất cả bài giảng')).toBeDefined()
  })

  it('renders promo card', () => {
    render(<LectureSidebar />)
    expect(screen.getByText('ƯU ĐÃI 50%')).toBeDefined()
    expect(screen.getByText('Khóa học Luyện thi THPT Quốc gia 2024')).toBeDefined()
  })
})

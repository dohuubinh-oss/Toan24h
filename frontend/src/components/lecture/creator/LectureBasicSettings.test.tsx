import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LectureBasicSettings from './LectureBasicSettings'

describe('LectureBasicSettings', () => {
  it('renders settings title', () => {
    render(<LectureBasicSettings />)
    expect(screen.getByText('Cấu hình cơ bản')).toBeDefined()
  })

  it('renders fields', () => {
    render(<LectureBasicSettings />)
    expect(screen.getByPlaceholderText('Nhập tên bài giảng...')).toBeDefined()
    expect(screen.getByText('Khối lớp')).toBeDefined()
    expect(screen.getByText('Lớp 12')).toBeDefined()
    expect(screen.getByText('Danh mục')).toBeDefined()
  })
})

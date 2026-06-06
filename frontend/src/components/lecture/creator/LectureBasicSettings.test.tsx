import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LectureBasicSettings from './LectureBasicSettings'
import { LectureCreatorProvider } from './LectureCreatorContext'

describe('LectureBasicSettings', () => {
  it('renders settings title', () => {
    render(
      <LectureCreatorProvider>
        <LectureBasicSettings />
      </LectureCreatorProvider>
    )
    expect(screen.getByText('Cấu hình cơ bản')).toBeDefined()
  })

  it('renders fields', () => {
    render(
      <LectureCreatorProvider>
        <LectureBasicSettings />
      </LectureCreatorProvider>
    )
    expect(screen.getByPlaceholderText('Nhập tên bài giảng...')).toBeDefined()
    expect(screen.getByText('Khối lớp')).toBeDefined()
    // By default grade is not selected, so category is not rendered!
    expect(screen.queryByText('Danh mục')).toBeNull()
  })
})


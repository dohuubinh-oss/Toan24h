import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LectureBasicSettings from './LectureBasicSettings'
import { LectureCreatorProvider } from './LectureCreatorContext'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

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
    expect(screen.getByPlaceholderText('VD: https://drive.google.com/...')).toBeDefined()
    expect(screen.getByText('Khối lớp')).toBeDefined()
    // By default grade is not selected, so category is not rendered!
    expect(screen.queryByText('Danh mục')).toBeNull()
  })

  it('updates gg_link and displays external link when a valid URL is entered', async () => {
    const { fireEvent } = await import('@testing-library/react')
    render(
      <LectureCreatorProvider>
        <LectureBasicSettings />
      </LectureCreatorProvider>
    )

    const driveInput = screen.getByPlaceholderText('VD: https://drive.google.com/...')
    expect(driveInput).toBeDefined()
    expect(screen.queryByTitle('Mở tài liệu trên Google Drive')).toBeNull()

    fireEvent.change(driveInput, { target: { value: 'https://drive.google.com/file/d/test1234' } })

    const openDriveLink = screen.getByTitle('Mở tài liệu trên Google Drive')
    expect(openDriveLink).toBeDefined()
    expect(openDriveLink.getAttribute('href')).toBe('https://drive.google.com/file/d/test1234')
  })
})


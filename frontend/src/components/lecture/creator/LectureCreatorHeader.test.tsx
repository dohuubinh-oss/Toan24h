import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LectureCreatorHeader from './LectureCreatorHeader'
import { LectureCreatorProvider } from './LectureCreatorContext'
import * as api from '@/lib/api'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
  deleteLecture: vi.fn(),
}))

vi.mock('@/components/ui/ToastProvider', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('LectureCreatorHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders create mode title and buttons without delete button', () => {
    render(
      <LectureCreatorProvider>
        <LectureCreatorHeader />
      </LectureCreatorProvider>
    )
    expect(screen.getByText('Soạn bài giảng mới')).toBeDefined()
    expect(screen.getByText('Tải file PDF đính kèm')).toBeDefined()
    expect(screen.getByText('Lưu & Xuất bản')).toBeDefined()
    expect(screen.queryByText('Xóa bài giảng')).toBeNull()
  })

  it('renders delete button in edit mode', () => {
    render(
      <LectureCreatorProvider editId="lecture-123">
        <LectureCreatorHeader />
      </LectureCreatorProvider>
    )
    expect(screen.getByText('Chỉnh sửa bài giảng')).toBeDefined()
    expect(screen.getByText('Cập nhật bài giảng')).toBeDefined()
    expect(screen.getByText('Xóa bài giảng')).toBeDefined()
  })

  it('opens confirm modal when delete button is clicked and cancels', () => {
    render(
      <LectureCreatorProvider editId="lecture-123">
        <LectureCreatorHeader />
      </LectureCreatorProvider>
    )
    const deleteBtn = screen.getByText('Xóa bài giảng')
    fireEvent.click(deleteBtn)

    expect(screen.getByText('Bạn có chắc chắn muốn xóa bài giảng này không? Hành động này không thể hoàn tác.')).toBeDefined()

    const cancelBtn = screen.getByText('Hủy')
    fireEvent.click(cancelBtn)

    expect(screen.queryByText('Bạn có chắc chắn muốn xóa bài giảng này không? Hành động này không thể hoàn tác.')).toBeNull()
    expect(api.deleteLecture).not.toHaveBeenCalled()
  })

  it('calls deleteLecture and navigates on confirm', async () => {
    vi.mocked(api.deleteLecture).mockResolvedValue(true)

    render(
      <LectureCreatorProvider editId="lecture-123">
        <LectureCreatorHeader />
      </LectureCreatorProvider>
    )
    const deleteBtn = screen.getByText('Xóa bài giảng')
    fireEvent.click(deleteBtn)

    // Modal is open, click confirm button ('Xóa')
    const confirmBtn = screen.getByRole('button', { name: 'Xóa' })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(api.deleteLecture).toHaveBeenCalledWith('lecture-123')
      expect(mockPush).toHaveBeenCalledWith('/dashboard/lectures')
    })
  })
})

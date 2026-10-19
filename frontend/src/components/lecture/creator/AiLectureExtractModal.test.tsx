import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AiLectureExtractModal from './AiLectureExtractModal'
import { ToastProvider } from '@/components/ui/ToastProvider'
import * as api from '@/lib/api'

// Mock apiFetch
vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}))

describe('AiLectureExtractModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-lecture-url')
    window.URL.revokeObjectURL = vi.fn()
  })

  const renderComponent = (props: Partial<Parameters<typeof AiLectureExtractModal>[0]> = {}) => {
    return render(
      <ToastProvider>
        <AiLectureExtractModal
          isOpen={true}
          onClose={vi.fn()}
          onExtracted={vi.fn()}
          {...props}
        />
      </ToastProvider>
    )
  }

  it('renders modal when isOpen is true and does not render when isOpen is false', () => {
    const { rerender } = renderComponent({ isOpen: true })
    expect(screen.getByText(/Bóc tách Dạng toán & Bài tập mẫu bằng AI/i)).toBeInTheDocument()

    rerender(
      <ToastProvider>
        <AiLectureExtractModal isOpen={false} onClose={vi.fn()} onExtracted={vi.fn()} />
      </ToastProvider>
    )
    expect(screen.queryByText(/Bóc tách Dạng toán & Bài tập mẫu bằng AI/i)).not.toBeInTheDocument()
  })

  it('handles image selection and removal', () => {
    renderComponent()

    const file1 = new File(['dummy 1'], 'lecture_page1.jpg', { type: 'image/jpeg' })
    const file2 = new File(['dummy 2'], 'lecture_page2.png', { type: 'image/png' })

    const fileInput = screen.getByLabelText(/Chọn ảnh bài giảng/i) as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file1, file2] } })

    expect(screen.getByText('lecture_page1.jpg')).toBeInTheDocument()
    expect(screen.getByText('lecture_page2.png')).toBeInTheDocument()
    expect(screen.getByText(/Đã chọn 2\/10 ảnh/i)).toBeInTheDocument()

    // Remove first file
    const removeButtons = screen.getAllByRole('button', { name: /Xóa ảnh/i })
    fireEvent.click(removeButtons[0])

    expect(screen.queryByText('lecture_page1.jpg')).not.toBeInTheDocument()
    expect(screen.getByText('lecture_page2.png')).toBeInTheDocument()
    expect(screen.getByText(/Đã chọn 1\/10 ảnh/i)).toBeInTheDocument()
  })

  it('calls extract API and triggers onExtracted with JSON string', async () => {
    const mockJson = `[{"mathType": "Dạng 1", "methods": []}]`
    vi.mocked(api.apiFetch).mockResolvedValueOnce({
      status: 'success',
      data: mockJson,
    })

    const onExtractedMock = vi.fn()
    const onCloseMock = vi.fn()

    renderComponent({
      onExtracted: onExtractedMock,
      onClose: onCloseMock,
    })

    const file = new File(['image content'], 'page1.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByLabelText(/Chọn ảnh bài giảng/i)
    fireEvent.change(fileInput, { target: { files: [file] } })

    const submitBtn = screen.getByRole('button', { name: /Bắt đầu bóc tách/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(api.apiFetch).toHaveBeenCalledTimes(1)
      expect(api.apiFetch).toHaveBeenCalledWith(
        '/lectures/extract-ai',
        expect.objectContaining({
          method: 'POST',
        })
      )
      expect(onExtractedMock).toHaveBeenCalledWith(mockJson)
      expect(onCloseMock).toHaveBeenCalled()
    })
  })

  it('shows error if submitted without selecting images', () => {
    renderComponent()

    const submitBtn = screen.getByRole('button', { name: /Bắt đầu bóc tách/i })
    fireEvent.click(submitBtn)

    expect(screen.getByText(/Vui lòng chọn ít nhất 1 ảnh bài giảng/i)).toBeInTheDocument()
    expect(api.apiFetch).not.toHaveBeenCalled()
  })
})

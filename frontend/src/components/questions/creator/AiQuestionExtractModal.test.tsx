import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AiQuestionExtractModal from './AiQuestionExtractModal'
import { ToastProvider } from '@/components/ui/ToastProvider'
import * as api from '@/lib/api'

// Mock apiFetch
vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}))

describe('AiQuestionExtractModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock URL.createObjectURL and revokeObjectURL
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url')
    window.URL.revokeObjectURL = vi.fn()
  })

  const renderComponent = (props: Partial<Parameters<typeof AiQuestionExtractModal>[0]> = {}) => {
    return render(
      <ToastProvider>
        <AiQuestionExtractModal
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
    expect(screen.getByText(/Bóc tách đề thi bằng AI/i)).toBeInTheDocument()

    rerender(
      <ToastProvider>
        <AiQuestionExtractModal isOpen={false} onClose={vi.fn()} onExtracted={vi.fn()} />
      </ToastProvider>
    )
    expect(screen.queryByText(/Bóc tách đề thi bằng AI/i)).not.toBeInTheDocument()
  })

  it('handles image selection and removal', async () => {
    renderComponent()

    const file1 = new File(['dummy content 1'], 'de_toan_p1.jpg', { type: 'image/jpeg' })
    const file2 = new File(['dummy content 2'], 'de_toan_p2.png', { type: 'image/png' })

    const fileInput = screen.getByLabelText(/Chọn ảnh đề thi/i) as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file1, file2] } })

    expect(screen.getByText('de_toan_p1.jpg')).toBeInTheDocument()
    expect(screen.getByText('de_toan_p2.png')).toBeInTheDocument()
    expect(screen.getByText(/Đã chọn 2\/10 ảnh/i)).toBeInTheDocument()

    // Remove first file
    const removeButtons = screen.getAllByRole('button', { name: /Xóa ảnh/i })
    fireEvent.click(removeButtons[0])

    expect(screen.queryByText('de_toan_p1.jpg')).not.toBeInTheDocument()
    expect(screen.getByText('de_toan_p2.png')).toBeInTheDocument()
    expect(screen.getByText(/Đã chọn 1\/10 ảnh/i)).toBeInTheDocument()
  })

  it('calls extract API and triggers onExtracted with question blocks', async () => {
    const mockBlocks = [
      {
        shared_content: '',
        is_group: false,
        questions: [
          {
            content: 'Câu 1: Giải phương trình $x^2 - 4 = 0$',
            type: 'Trắc nghiệm',
            options: ['A. x = 2', 'B. x = -2', 'C. x = ±2', 'D. Vô nghiệm'],
            correct_answer: 'C. x = ±2',
          },
        ],
      },
    ]

    vi.mocked(api.apiFetch).mockResolvedValueOnce({
      status: 'success',
      data: mockBlocks,
    })

    const onExtractedMock = vi.fn()
    const onCloseMock = vi.fn()

    renderComponent({
      onExtracted: onExtractedMock,
      onClose: onCloseMock,
    })

    // Add image
    const file = new File(['image bytes'], 'page1.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByLabelText(/Chọn ảnh đề thi/i)
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Click submit
    const submitBtn = screen.getByRole('button', { name: /Bắt đầu bóc tách/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(api.apiFetch).toHaveBeenCalledTimes(1)
      expect(api.apiFetch).toHaveBeenCalledWith(
        '/questions/extract-ai',
        expect.objectContaining({
          method: 'POST',
        })
      )
      expect(onExtractedMock).toHaveBeenCalledWith([
        {
          shared_content: '',
          is_group: false,
          questions: [
            expect.objectContaining({
              content: 'Câu 1: Giải phương trình $x^2 - 4 = 0$',
              type: 'Trắc nghiệm',
              options: ['x = 2', 'x = -2', 'x = ±2', 'Vô nghiệm'],
              correct_answer: 'C. x = ±2',
              grade: 9,
              difficulty_level: 'Thông hiểu',
            }),
          ],
        },
      ])
      expect(onCloseMock).toHaveBeenCalled()
    })
  })

  it('allows selecting target grade and includes it in extraction form data', async () => {
    vi.mocked(api.apiFetch).mockResolvedValueOnce({
      status: 'success',
      data: [
        {
          shared_content: '',
          is_group: false,
          questions: [
            {
              content: 'Phương trình bậc nhất',
              type: 'Tự luận',
              grade: 8,
              topic: 'Cách giải phương trình bậc nhất một ẩn',
            },
          ],
        },
      ],
    })

    const onExtractedMock = vi.fn()
    renderComponent({
      onExtracted: onExtractedMock,
      defaultGrade: '8',
    })

    const gradeSelect = screen.getByLabelText(/Khối lớp mục tiêu/i) as HTMLSelectElement
    expect(gradeSelect.value).toBe('8')

    // Change grade to 7
    fireEvent.change(gradeSelect, { target: { value: '7' } })
    expect(gradeSelect.value).toBe('7')

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByLabelText(/Chọn ảnh đề thi/i)
    fireEvent.change(fileInput, { target: { files: [file] } })

    const submitBtn = screen.getByRole('button', { name: /Bắt đầu bóc tách/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(api.apiFetch).toHaveBeenCalledTimes(1)
      const callArgs = vi.mocked(api.apiFetch).mock.calls[0]
      const formData = callArgs[1]?.body as FormData
      expect(formData.get('grade')).toBe('7')
    })
  })

  it('shows error if submitted without selecting images', async () => {
    renderComponent()

    const submitBtn = screen.getByRole('button', { name: /Bắt đầu bóc tách/i })
    fireEvent.click(submitBtn)

    expect(screen.getByText(/Vui lòng chọn ít nhất 1 ảnh đề thi/i)).toBeInTheDocument()
    expect(api.apiFetch).not.toHaveBeenCalled()
  })
})

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DangToanCard from './DangToanCard'
import { DangToanItem } from './LectureCreatorContext'
import { toast } from '@/components/ui/ToastProvider'

// Mock toast
vi.mock('@/components/ui/ToastProvider', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

// Mock RichTextEditor
vi.mock('@/components/questions/creator/editor/RichTextEditor', () => ({
  default: ({ content, onChange, placeholder }: any) => (
    <input
      data-testid="rich-text-editor"
      placeholder={placeholder}
      value={content || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

// Mock SharedEditorCard
vi.mock('@/components/questions/creator/editor/SharedEditorCard', () => ({
  default: ({ title, content, onContentChange, placeholder }: any) => (
    <div data-testid={`shared-editor-${title}`}>
      <span>{title}</span>
      <textarea
        placeholder={placeholder}
        value={content || ''}
        onChange={(e) => onContentChange(e.target.value)}
      />
    </div>
  ),
}))

// Mock AiLectureExtractModal
vi.mock('./AiLectureExtractModal', () => ({
  default: ({ isOpen, onClose, onExtracted, title, description }: any) => {
    if (!isOpen) return null
    return (
      <div data-testid="ai-lecture-extract-modal">
        <span data-testid="modal-title">{title}</span>
        <span data-testid="modal-desc">{description}</span>
        <button
          onClick={() =>
            onExtracted(
              JSON.stringify([
                {
                  mathType: 'Dạng toán bóc tách từ ảnh',
                  methods: [
                    {
                      solution: 'Phương pháp giải từ ảnh',
                      problems: [{ problem: 'Ví dụ từ ảnh' }],
                    },
                  ],
                },
              ])
            )
          }
        >
          Kích hoạt trích xuất thành công
        </button>
        <button onClick={() => onExtracted('invalid-json')}>Kích hoạt trích xuất lỗi</button>
        <button onClick={onClose}>Đóng modal</button>
      </div>
    )
  },
}))

describe('DangToanCard Component', () => {
  const mockDangToan: DangToanItem = {
    id: 'dt-1',
    mathType: 'Dạng 1. Rút gọn biểu thức',
    methods: [
      {
        id: 'm-1',
        methodName: 'Phương pháp 1',
        solution: 'Nội dung phương pháp ban đầu',
        exercise: { content: 'Bài tập mẫu ban đầu' },
        problemImage: null,
        solutionImage: null,
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Dạng toán header, title, and action buttons', () => {
    const handleChange = vi.fn()
    const handleRemove = vi.fn()

    render(
      <DangToanCard
        dangToan={mockDangToan}
        index={0}
        onChange={handleChange}
        onRemove={handleRemove}
      />
    )

    expect(screen.getByText('Dạng Toán 1')).toBeInTheDocument()
    expect(screen.getByTitle(/Sửa Dạng Toán từ ảnh bằng AI/i)).toBeInTheDocument()
    expect(screen.getByTitle(/Xóa Dạng Toán/i)).toBeInTheDocument()
  })

  it('calls onRemove when clicking delete button', () => {
    const handleRemove = vi.fn()
    render(
      <DangToanCard
        dangToan={mockDangToan}
        index={0}
        onChange={vi.fn()}
        onRemove={handleRemove}
      />
    )

    fireEvent.click(screen.getByTitle(/Xóa Dạng Toán/i))
    expect(handleRemove).toHaveBeenCalledTimes(1)
  })

  it('opens AI extract modal when clicking edit button and passes custom title', () => {
    render(
      <DangToanCard
        dangToan={mockDangToan}
        index={0}
        onChange={vi.fn()}
      />
    )

    expect(screen.queryByTestId('ai-lecture-extract-modal')).not.toBeInTheDocument()

    // Click edit button
    fireEvent.click(screen.getByTitle(/Sửa Dạng Toán từ ảnh bằng AI/i))

    expect(screen.getByTestId('ai-lecture-extract-modal')).toBeInTheDocument()
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Bóc tách & Cập nhật Dạng toán 1 bằng AI')
  })

  it('updates only this Dạng toán and preserves its id on successful extraction', () => {
    const handleChange = vi.fn()
    render(
      <DangToanCard
        dangToan={mockDangToan}
        index={0}
        onChange={handleChange}
      />
    )

    // Open modal
    fireEvent.click(screen.getByTitle(/Sửa Dạng Toán từ ảnh bằng AI/i))

    // Trigger extract
    fireEvent.click(screen.getByText('Kích hoạt trích xuất thành công'))

    expect(handleChange).toHaveBeenCalledTimes(1)
    const updatedData = handleChange.mock.calls[0][0]

    // Crucial check: id must stay dt-1 (only updating this component)
    expect(updatedData.id).toBe('dt-1')
    expect(updatedData.mathType).toBe('Dạng toán bóc tách từ ảnh')
    expect(updatedData.methods.length).toBeGreaterThan(0)
    expect(updatedData.methods[0].solution).toContain('Phương pháp giải từ ảnh')
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Đã cập nhật Dạng toán 1 thành công'))

    // Modal should close
    expect(screen.queryByTestId('ai-lecture-extract-modal')).not.toBeInTheDocument()
  })

  it('handles JSON parsing errors gracefully and shows toast error', () => {
    const handleChange = vi.fn()
    render(
      <DangToanCard
        dangToan={mockDangToan}
        index={0}
        onChange={handleChange}
      />
    )

    // Open modal
    fireEvent.click(screen.getByTitle(/Sửa Dạng Toán từ ảnh bằng AI/i))

    // Trigger invalid json
    fireEvent.click(screen.getByText('Kích hoạt trích xuất lỗi'))

    expect(handleChange).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalled()
  })
})

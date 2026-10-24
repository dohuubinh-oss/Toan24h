import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CreateExamPage from './page'
import * as api from '@/lib/api'

// Mock next/navigation
const mockPush = vi.fn()
const mockReplace = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}))

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock child components
vi.mock('@/components/exams/ExamHeader', () => ({
  default: ({ onSave, isSaving }: any) => (
    <div data-testid="exam-header-mock">
      ExamHeader
      <button onClick={onSave} disabled={isSaving}>Lưu đề thi</button>
    </div>
  )
}))

vi.mock('@/components/exams/ExamQuestionList', () => ({
  default: ({ onRemoveQuestion }: any) => (
    <div data-testid="exam-question-list-mock">
      ExamQuestionList
      <button onClick={() => onRemoveQuestion('q-1')}>Xóa câu 1</button>
    </div>
  )
}))

vi.mock('@/components/exams/ExamConfigSidebar', () => ({
  default: ({ onChange }: any) => (
    <div data-testid="exam-config-sidebar-mock">
      ExamConfigSidebar
      <button onClick={() => {
        onChange('title', 'Đề kiểm tra giữa kỳ 1')
        onChange('examCode', 'MID01')
        onChange('grade', '9')
        onChange('duration', 45)
      }}>Điền cấu hình</button>
    </div>
  )
}))

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
  getExamById: vi.fn(),
  getQuestions: vi.fn(),
  checkOrphanQuestions: vi.fn(),
  updateExam: vi.fn(),
}))

describe('CreateExamPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
  })

  it('renders all layout components', () => {
    render(<CreateExamPage />)
    expect(screen.getByTestId('exam-header-mock')).toBeInTheDocument()
    expect(screen.getByTestId('exam-question-list-mock')).toBeInTheDocument()
    expect(screen.getByTestId('exam-config-sidebar-mock')).toBeInTheDocument()
  })

  it('sorts questionIds on save with multiple-choice first (easy to hard) and essay last (easy to hard)', async () => {
    mockSearchParams = new URLSearchParams('qids=q-essay-hard,q-mcq-hard,q-essay-easy,q-mcq-easy')

    vi.mocked(api.getQuestions).mockResolvedValueOnce({
      data: [
        { id: 'q-essay-hard', type: 'Tự luận', difficulty_level: 'Vận dụng cao' },
        { id: 'q-mcq-hard', type: 'Trắc nghiệm', difficulty_level: 'Vận dụng' },
        { id: 'q-essay-easy', type: 'Tự luận', difficulty_level: 'Nhận biết' },
        { id: 'q-mcq-easy', type: 'Trắc nghiệm', difficulty_level: 'Nhận biết' },
      ],
      total: 4,
    } as any)

    render(<CreateExamPage />)

    await waitFor(() => {
      expect(api.getQuestions).toHaveBeenCalled()
    })

    // Điền cấu hình hợp lệ
    fireEvent.click(screen.getByText('Điền cấu hình'))

    // Nhấp lưu đề thi
    const saveBtn = screen.getAllByText('Lưu đề thi')[0]
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(api.apiFetch).toHaveBeenCalledWith(
        '/exams',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"questionIds":["q-mcq-easy","q-mcq-hard","q-essay-easy","q-essay-hard"]')
        })
      )
    })
  })

  it('detects orphan questions on save when editing and prompts modal', async () => {
    mockSearchParams = new URLSearchParams('id=exam-123')
    
    // Mock getExamById returning 2 questions
    vi.mocked(api.getExamById).mockResolvedValueOnce({
      id: 'exam-123',
      title: 'Đề kiểm tra 1 tiết',
      examCode: 'KT01',
      grade: '9',
      duration: 45,
      cate: 'exam',
      type: '1 tiết',
      questionIds: ['q-1', 'q-2'],
    })

    vi.mocked(api.getQuestions).mockResolvedValueOnce({
      data: [
        { id: 'q-1', bookName: 'Câu 1', content: 'Nội dung 1' },
        { id: 'q-2', bookName: 'Câu 2', content: 'Nội dung 2' },
      ],
      total: 2,
    } as any)

    vi.mocked(api.checkOrphanQuestions).mockResolvedValueOnce([
      { id: 'q-1', bookName: 'Câu 1', content: 'Nội dung 1' }
    ])

    render(<CreateExamPage />)

    // Wait for exam to load
    await waitFor(() => {
      expect(api.getExamById).toHaveBeenCalledWith('exam-123')
    })

    // Remove question 1
    const removeBtn = screen.getByText('Xóa câu 1')
    fireEvent.click(removeBtn)

    // Click Save
    const saveBtn = screen.getAllByText('Lưu đề thi')[0]
    fireEvent.click(saveBtn)

    // checkOrphanQuestions should be called for q-1
    await waitFor(() => {
      expect(api.checkOrphanQuestions).toHaveBeenCalledWith('exam-123', ['q-1'])
    })

    // Modal should appear
    expect(await screen.findByText(/Phát hiện câu hỏi không còn thuộc đề thi nào/i)).toBeInTheDocument()
    expect(screen.getByText('Câu 1')).toBeInTheDocument()

    // Confirm delete orphan
    const confirmDeleteBtn = screen.getByText(/Xóa 1 câu đã chọn khỏi ngân hàng/i)
    fireEvent.click(confirmDeleteBtn)

    await waitFor(() => {
      expect(api.updateExam).toHaveBeenCalledWith(
        'exam-123',
        expect.objectContaining({
          questionIds: ['q-2'],
        }),
        ['q-1']
      )
    })
  })

  it('keeps orphan questions when user chooses to keep them in question bank', async () => {
    mockSearchParams = new URLSearchParams('id=exam-123')
    
    vi.mocked(api.getExamById).mockResolvedValueOnce({
      id: 'exam-123',
      title: 'Đề kiểm tra 1 tiết',
      examCode: 'KT01',
      grade: '9',
      duration: 45,
      cate: 'exam',
      type: '1 tiết',
      questionIds: ['q-1', 'q-2'],
    })

    vi.mocked(api.getQuestions).mockResolvedValueOnce({
      data: [
        { id: 'q-1', bookName: 'Câu 1', content: 'Nội dung 1' },
        { id: 'q-2', bookName: 'Câu 2', content: 'Nội dung 2' },
      ],
      total: 2,
    } as any)

    vi.mocked(api.checkOrphanQuestions).mockResolvedValueOnce([
      { id: 'q-1', bookName: 'Câu 1', content: 'Nội dung 1' }
    ])

    render(<CreateExamPage />)

    await waitFor(() => {
      expect(api.getExamById).toHaveBeenCalledWith('exam-123')
    })

    // Remove question 1
    fireEvent.click(screen.getByText('Xóa câu 1'))

    // Click Save
    fireEvent.click(screen.getAllByText('Lưu đề thi')[0])

    // Modal appears
    expect(await screen.findByText(/Phát hiện câu hỏi không còn thuộc đề thi nào/i)).toBeInTheDocument()

    // Click "Giữ lại toàn bộ trong ngân hàng"
    const keepBtn = screen.getByRole('button', { name: /giữ lại toàn bộ/i })
    fireEvent.click(keepBtn)

    await waitFor(() => {
      expect(api.updateExam).toHaveBeenCalledWith(
        'exam-123',
        expect.objectContaining({
          questionIds: ['q-2'],
        }),
        undefined
      )
    })
  })
})

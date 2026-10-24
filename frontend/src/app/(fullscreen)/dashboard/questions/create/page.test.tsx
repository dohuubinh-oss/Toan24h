import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CreateQuestionPage from './page'
import { toast } from '@/components/ui/ToastProvider'

const mockPush = vi.fn()
const mockBack = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
  useSearchParams: () => mockSearchParams,
}))

vi.mock('@/components/ui/ToastProvider', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}))

const mockApiFetch = vi.fn()
vi.mock('@/lib/api', () => ({
  apiFetch: (...args: any[]) => mockApiFetch(...args),
  getQuestion: vi.fn(),
  updateQuestion: vi.fn(),
  extractDiagramSvg: (diagram: any) => diagram || null,
}))

describe('CreateQuestionPage - Drive Link Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
  })

  it('blocks saving and shows toast error when Link Drive is missing', async () => {
    const { container } = render(<CreateQuestionPage />)

    const textarea = container.querySelector('textarea')!
    expect(textarea).toBeTruthy()
    fireEvent.change(textarea, {
      target: {
        value: JSON.stringify([
          {
            type_question: 'single',
            content: 'Câu hỏi test không có Link Drive',
            type: 'Trắc nghiệm',
            grade: 10,
            topic: 'Đại số',
            difficulty_level: 'Nhận biết',
            options: ['A', 'B', 'C', 'D'],
            correct_answer: 'A',
            // gg_drive is omitted
          }
        ])
      }
    })

    const parseBtn = screen.getByRole('button', { name: /Xử lý JSON/i })
    fireEvent.click(parseBtn)

    // Tìm nút Lưu vào ngân hàng
    const saveBtn = await screen.findByRole('button', { name: /Lưu vào ngân hàng/i })
    expect(saveBtn).not.toBeDisabled()

    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Vui lòng nhập Link Drive trước khi lưu vào ngân hàng!')
      expect(mockApiFetch).not.toHaveBeenCalled()
    })
  })

  it('allows saving when Link Drive is provided', async () => {
    mockApiFetch.mockResolvedValueOnce({ status: 'success' })
    const { container } = render(<CreateQuestionPage />)

    const textarea = container.querySelector('textarea')!
    expect(textarea).toBeTruthy()
    fireEvent.change(textarea, {
      target: {
        value: JSON.stringify([
          {
            type_question: 'single',
            content: 'Câu hỏi test có Link Drive',
            type: 'Trắc nghiệm',
            grade: 10,
            topic: 'Đại số',
            difficulty_level: 'Nhận biết',
            options: ['A', 'B', 'C', 'D'],
            correct_answer: 'A',
            gg_drive: 'https://drive.google.com/file/d/test12345/view'
          }
        ])
      }
    })

    const parseBtn = screen.getByRole('button', { name: /Xử lý JSON/i })
    fireEvent.click(parseBtn)

    const saveBtn = await screen.findByRole('button', { name: /Lưu vào ngân hàng/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/questions/bulk', expect.objectContaining({
        method: 'POST'
      }))
      expect(mockBack).toHaveBeenCalled()
    })
  })

  it('saves diagram_svg properly for single question when clicking Lưu vào ngân hàng', async () => {
    mockApiFetch.mockResolvedValueOnce({ status: 'success' })
    const { container } = render(<CreateQuestionPage />)

    const textarea = container.querySelector('textarea')!
    fireEvent.change(textarea, {
      target: {
        value: JSON.stringify([
          {
            type_question: 'single',
            content: 'Câu hỏi đơn có hình minh họa',
            diagram_svg: '/uploads/temp/single_diagram.png',
            type: 'Trắc nghiệm',
            grade: 9,
            topic: 'Hình học',
            difficulty_level: 'Thông hiểu',
            options: ['A', 'B', 'C', 'D'],
            correct_answer: 'A',
            gg_drive: 'https://drive.google.com/file/d/test-diagram/view'
          }
        ])
      }
    })

    const parseBtn = screen.getByRole('button', { name: /Xử lý JSON/i })
    fireEvent.click(parseBtn)

    const saveBtn = await screen.findByRole('button', { name: /Lưu vào ngân hàng/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/questions/bulk', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('/uploads/temp/single_diagram.png')
      }))
      const calledBody = JSON.parse(mockApiFetch.mock.calls[0][1].body)
      expect(calledBody[0].diagram_svg).toBe('/uploads/temp/single_diagram.png')
      expect(calledBody[0].questions[0].diagram_svg).toBe('/uploads/temp/single_diagram.png')
    })
  })

  it('saves group diagram_svg on block and sets subquestions diagram_svg to null', async () => {
    mockApiFetch.mockResolvedValueOnce({ status: 'success' })
    const { container } = render(<CreateQuestionPage />)

    const textarea = container.querySelector('textarea')!
    fireEvent.change(textarea, {
      target: {
        value: JSON.stringify([
          {
            type_question: 'group',
            shared_content: 'Đoạn thông tin chung cho cả nhóm',
            diagram_svg: '/uploads/temp/group_diagram.png',
            questions: [
              {
                content: 'Câu con 1',
                type: 'Trắc nghiệm',
                grade: 9,
                topic: 'Hình học',
                difficulty_level: 'Nhận biết',
                options: ['A', 'B'],
                correct_answer: 'A',
                gg_drive: 'https://drive.google.com/file/d/test-group/view'
              },
              {
                content: 'Câu con 2',
                type: 'Trắc nghiệm',
                grade: 9,
                topic: 'Hình học',
                difficulty_level: 'Thông hiểu',
                options: ['C', 'D'],
                correct_answer: 'C',
                gg_drive: 'https://drive.google.com/file/d/test-group/view'
              }
            ]
          }
        ])
      }
    })

    const parseBtn = screen.getByRole('button', { name: /Xử lý JSON/i })
    fireEvent.click(parseBtn)

    const saveBtn = await screen.findByRole('button', { name: /Lưu vào ngân hàng/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/questions/bulk', expect.objectContaining({
        method: 'POST'
      }))
      const calledBody = JSON.parse(mockApiFetch.mock.calls[0][1].body)
      expect(calledBody[0].is_group).toBe(true)
      expect(calledBody[0].diagram_svg).toBe('/uploads/temp/group_diagram.png')
      expect(calledBody[0].questions[0].diagram_svg).toBeNull()
      expect(calledBody[0].questions[1].diagram_svg).toBeNull()
    })
  })
})

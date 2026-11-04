import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QuestionReportModal } from './QuestionReportModal'
import * as api from '@/lib/api'

vi.mock('@/lib/api', () => ({
  reportQuestion: vi.fn().mockResolvedValue({ success: true }),
  submitAppeal: vi.fn().mockResolvedValue({ success: true }),
}))

describe('QuestionReportModal', () => {
  it('renders report question modal by default', () => {
    render(
      <QuestionReportModal
        isOpen={true}
        onClose={vi.fn()}
        questionId="q1"
      />
    )
    expect(screen.getByText('Báo lỗi câu hỏi')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Nhập chi tiết nội dung cần phản hồi/i)).toBeInTheDocument()
  })

  it('renders appeal mode when readonly is true', () => {
    render(
      <QuestionReportModal
        isOpen={true}
        onClose={vi.fn()}
        readonly={true}
        questionId="q1"
        resultId="res1"
        detailId="det1"
      />
    )
    expect(screen.getByText('Kháng cáo kết quả')).toBeInTheDocument()
  })

  it('submits report question when text is entered and button is clicked', async () => {
    const handleClose = vi.fn()
    render(
      <QuestionReportModal
        isOpen={true}
        onClose={handleClose}
        questionId="123"
      />
    )

    const textarea = screen.getByPlaceholderText(/Nhập chi tiết nội dung cần phản hồi/i)
    fireEvent.change(textarea, { target: { value: 'Sai đáp án câu C' } })

    const submitBtn = screen.getByText('Gửi yêu cầu')
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(api.reportQuestion).toHaveBeenCalledWith('123', 'Sai đáp án câu C')
      expect(handleClose).toHaveBeenCalled()
    })
  })
})

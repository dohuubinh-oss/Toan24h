import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuestionHintTabs from './QuestionHintTabs'

describe('QuestionHintTabs Component', () => {
  it('renders fallback when no hints are provided', () => {
    const handleClose = vi.fn()
    render(
      <QuestionHintTabs onClose={handleClose} />
    )

    expect(screen.getByText(/Câu hỏi này chưa có gợi ý riêng/i)).toBeInTheDocument()
  })

  it('renders tabs and allows clicking to navigate between tabs', async () => {
    const user = userEvent.setup()
    render(
      <QuestionHintTabs 
        hint="Gợi ý ban đầu"
        shortAnswer="Mẹo tính nhanh 123"
        generalMethod="Công thức chung xyz"
        solutionGuide="Đây là lời giải mẫu chi tiết"
      />
    )

    // Initially Step 1 (Gợi ý) is active
    expect(screen.getByText('Gợi ý hướng giải bài toán')).toBeInTheDocument()
    expect(screen.getByText('Gợi ý ban đầu')).toBeInTheDocument()

    // Click Step 2 (Mẹo giải nhanh)
    const tabShortAnswer = screen.getByText('Mẹo giải nhanh')
    await user.click(tabShortAnswer)
    expect(screen.getByText('Mẹo giải nhanh & Lời giải ngắn')).toBeInTheDocument()
    expect(screen.getByText('Mẹo tính nhanh 123')).toBeInTheDocument()

    // Click Step 3 (Lời giải mẫu - styled like Hình 3)
    const tabSolution = screen.getByText('Lời giải mẫu')
    await user.click(tabSolution)
    expect(screen.getByText('Lời giải chi tiết (Đáp án chuẩn)')).toBeInTheDocument()
    expect(screen.getByText('Đây là lời giải mẫu chi tiết')).toBeInTheDocument()
  })

  it('advances sequentially when clicking next hint button', async () => {
    const user = userEvent.setup()
    render(
      <QuestionHintTabs 
        hint="Bước 1 gợi ý"
        shortAnswer="Bước 2 mẹo nhanh"
      />
    )

    expect(screen.getByText('Bước 1 gợi ý')).toBeInTheDocument()
    const nextBtn = screen.getByText(/Xem tiếp: Mẹo giải nhanh/i)
    await user.click(nextBtn)
    expect(screen.getByText('Bước 2 mẹo nhanh')).toBeInTheDocument()
  })
})

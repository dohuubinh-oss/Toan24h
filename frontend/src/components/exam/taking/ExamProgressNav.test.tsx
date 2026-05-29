import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ExamProgressNav from './ExamProgressNav'
import userEvent from '@testing-library/user-event'

describe('ExamProgressNav Component', () => {
  it('renders exam info and progress', () => {
    render(
      <ExamProgressNav
        title="Kiểm tra Đại số - Chương 2"
        subject="Toán Lớp 9"
        completedQuestions={8}
        totalQuestions={10}
        timeLeft="15:00"
        onBack={() => {}}
      />
    )
    
    expect(screen.getByText('Kiểm tra Đại số - Chương 2')).toBeInTheDocument()
    expect(screen.getByText('Toán Lớp 9')).toBeInTheDocument()
    expect(screen.getByText('Tiến độ hoàn thành: 8/10 câu')).toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText('15:00')).toBeInTheDocument()
  })

  it('calls onBack when back button is clicked', async () => {
    const handleBack = vi.fn()
    const user = userEvent.setup()
    
    render(
      <ExamProgressNav
        title="Test"
        subject="Subject"
        completedQuestions={1}
        totalQuestions={2}
        timeLeft="10:00"
        onBack={handleBack}
      />
    )
    
    const backBtn = screen.getByRole('button', { name: /trở lại/i })
    await user.click(backBtn)
    expect(handleBack).toHaveBeenCalledTimes(1)
  })
})

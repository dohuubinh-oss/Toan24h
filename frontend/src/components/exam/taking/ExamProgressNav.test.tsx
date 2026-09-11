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

  it('renders coin badge on taking page and hides it on result page', () => {
    const { rerender } = render(
      <ExamProgressNav
        title="Luyện tập"
        subject="Toán Lớp 8"
        completedQuestions={2}
        totalQuestions={5}
        examType="practice"
        points={50}
        onBack={() => {}}
      />
    )
    expect(screen.getByText('50 xu')).toBeInTheDocument()

    rerender(
      <ExamProgressNav
        title="Kết quả bài làm"
        subject="Toán Lớp 8"
        completedQuestions={5}
        totalQuestions={5}
        timeLeft="Tổng điểm: 9.0/10"
        examType="result"
        points={50}
        onBack={() => {}}
      />
    )
    expect(screen.queryByText('50 xu')).not.toBeInTheDocument()
    expect(screen.getByText('Tổng điểm: 9.0/10')).toBeInTheDocument()
  })
})

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MilestoneExamCard } from './MilestoneExamCard'

describe('MilestoneExamCard Component', () => {
  const sampleExam = {
    id: 'exam-gk1-01',
    title: 'Đề thi thử Giữa kì 1 Toán 6 - Mã đề 101',
    examCode: 'GK1-T6-101',
    duration: 90,
    questionIds: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'],
    cate: 'exam',
    type: 'Giữa kì 1',
  }

  it('renders exam title and exam code', () => {
    render(<MilestoneExamCard exam={sampleExam} />)

    expect(screen.getByText('Đề thi thử Giữa kì 1 Toán 6 - Mã đề 101')).toBeInTheDocument()
    expect(screen.getByText('GK1-T6-101')).toBeInTheDocument()
  })

  it('renders "Thi thử" badge for cate="exam"', () => {
    render(<MilestoneExamCard exam={sampleExam} />)

    expect(screen.getByText('Thi thử')).toBeInTheDocument()
  })

  it('renders "Luyện tập" badge for cate="practice"', () => {
    const practiceExam = {
      ...sampleExam,
      cate: 'practice',
    }
    render(<MilestoneExamCard exam={practiceExam} />)

    expect(screen.getByText('Luyện tập')).toBeInTheDocument()
    expect(screen.queryByText('Thi thử')).not.toBeInTheDocument()
  })

  it('renders milestone/type badge', () => {
    render(<MilestoneExamCard exam={sampleExam} />)

    expect(screen.getByText('Giữa kì 1')).toBeInTheDocument()
  })

  it('renders recommended badge when isRecommended is true', () => {
    const { rerender } = render(<MilestoneExamCard exam={sampleExam} isRecommended={true} />)

    expect(screen.getByText(/Khuyên làm|Gợi ý|Đề xuất/i)).toBeInTheDocument()

    rerender(<MilestoneExamCard exam={sampleExam} isRecommended={false} />)
    expect(screen.queryByText(/Khuyên làm|Gợi ý|Đề xuất/i)).not.toBeInTheDocument()
  })

  it('renders duration and question count correctly', () => {
    render(<MilestoneExamCard exam={sampleExam} />)

    expect(screen.getByText(/90\s*phút/i)).toBeInTheDocument()
    expect(screen.getByText(/8\s*câu/i)).toBeInTheDocument()
  })

  it('renders "Không giới hạn" when duration is 0 or undefined', () => {
    const untimedExam = {
      ...sampleExam,
      duration: 0,
    }
    render(<MilestoneExamCard exam={untimedExam} />)

    expect(screen.getByText(/Không giới hạn/i)).toBeInTheDocument()
  })

  it('renders best score when bestSubmission is present', () => {
    const bestSubmission = {
      id: 'sub-01',
      score: 9.0,
      totalScore: 9.0,
      status: 'graded',
    }
    render(<MilestoneExamCard exam={sampleExam} bestSubmission={bestSubmission} />)

    expect(screen.getByText(/9(\.0)?\/10/i)).toBeInTheDocument()
  })

  it('does not display score if bestSubmission is absent', () => {
    render(<MilestoneExamCard exam={sampleExam} bestSubmission={undefined} />)

    expect(screen.queryByText(/\/10/i)).not.toBeInTheDocument()
  })

  it('renders action button linking to /exam/:id/take with >= 44x44px touch target', () => {
    render(<MilestoneExamCard exam={sampleExam} />)

    const link = screen.getByRole('link', { name: /Làm bài thi|Vào làm bài/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/exam/exam-gk1-01/take')
    expect(link.className).toContain('min-h-[44px]')
  })

  it('has Material 3 outlined card container styling', () => {
    const { container } = render(<MilestoneExamCard exam={sampleExam} />)

    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('border')
    expect(card.className).toContain('rounded-2xl')
  })
})

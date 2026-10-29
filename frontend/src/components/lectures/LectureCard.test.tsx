import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LectureCard, PracticeLectureCard } from './LectureCard'

describe('LectureCard and PracticeLectureCard', () => {
  it('renders LectureCard linking to lecture detail page', () => {
    render(
      <LectureCard 
        id="lec-123"
        title="Phương trình bậc nhất"
        chapter="Đại số"
        status="NOT_STARTED"
        practiceCount={3}
        grade="5"
      />
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/lectures/lop/5/lec-123')
    expect(screen.getByText('Phương trình bậc nhất')).toBeInTheDocument()
  })

  it('renders completed LectureCard with green styling and average score', () => {
    render(
      <LectureCard 
        id="lec-completed"
        title="Phương trình bậc nhất hai ẩn"
        chapter="Đại số"
        status="COMPLETED"
        practiceCount={2}
        averageScore={8.5}
        grade="9"
      />
    )

    expect(screen.getByText('Hoàn thành')).toBeInTheDocument()
    expect(screen.getByText('8.5đ')).toBeInTheDocument()
    const container = screen.getByRole('link')
    expect(container.className).toContain('border-emerald-500')
  })

  it('renders in-progress LectureCard with blue primary border', () => {
    render(
      <LectureCard 
        id="lec-progress"
        title="Hệ hai phương trình bậc nhất hai ẩn"
        chapter="Đại số"
        status="PENDING"
        practiceCount={3}
        grade="9"
      />
    )

    expect(screen.getByText('Đang học')).toBeInTheDocument()
    const container = screen.getByRole('link')
    expect(container.className).toContain('border-primary')
  })

  it('renders locked LectureCard with Lock icon and lock reason', () => {
    render(
      <LectureCard 
        id="lec-locked"
        title="Giải bài toán bằng cách lập hệ phương trình"
        chapter="Đại số"
        status="NOT_STARTED"
        practiceCount={2}
        isLocked={true}
        lockReason="Cần hoàn thành bài trước để mở khóa"
        grade="9"
      />
    )

    expect(screen.getByText('Chưa mở khóa')).toBeInTheDocument()
    expect(screen.getByText('Cần hoàn thành bài trước để mở khóa')).toBeInTheDocument()
    // Khóa thì không nên là thẻ link thông thường chuyển trang
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('renders PracticeLectureCard linking to lecture detail page when href is passed', () => {
    render(
      <PracticeLectureCard 
        id="prac-456"
        grade="5"
        title="Ôn tập giữa kì 1"
        chapter="Ôn tập"
        practiceCount={2}
        href="/lectures/lop/5/prac-456"
        thumbnailUrl="https://example.com/thumb.png"
      />
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/lectures/lop/5/prac-456')
    expect(screen.getByText('Ôn tập giữa kì 1')).toBeInTheDocument()
    expect(screen.getByText('Luyện tập & Đề')).toBeInTheDocument()
    expect(screen.getByText('2 Đề')).toBeInTheDocument()
  })

  it('defaults PracticeLectureCard to lecture detail page if id is provided without href', () => {
    render(
      <PracticeLectureCard 
        id="prac-789"
        grade="5"
        title="Đề thi thử cuối kì"
        practiceCount={5}
      />
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/lectures/lop/5/prac-789')
  })
})

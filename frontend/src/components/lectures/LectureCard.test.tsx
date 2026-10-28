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

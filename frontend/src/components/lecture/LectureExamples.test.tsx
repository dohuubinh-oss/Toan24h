import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LectureExamples } from './LectureContent'

describe('LectureExamples', () => {
  it('renders nothing when examples array is empty', () => {
    const { container } = render(<LectureExamples examples={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when examples contains only empty DangToan items', () => {
    const emptyExamples = [
      {
        id: '1',
        dangToanName: '',
        methods: [
          {
            id: 'm1',
            methodName: '',
            methodContent: '',
            exercise: { content: '' }
          }
        ]
      }
    ]
    const { container } = render(<LectureExamples examples={emptyExamples as any} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders correctly when examples contains valid data', () => {
    const validExamples = [
      {
        id: '1',
        dangToanName: 'Dạng 1. Đơn thức',
        methods: [
          {
            id: 'm1',
            methodName: 'Phương pháp rút gọn',
            methodContent: '<p>Cộng trừ các hệ số</p>',
            exercise: { content: '<p>Đề bài: Tính 2x + 3x</p>' }
          }
        ]
      }
    ]
    render(<LectureExamples examples={validExamples as any} />)
    expect(screen.getByText('2. Phân tích bài tập mẫu')).toBeInTheDocument()
    expect(screen.getByText('Dạng 1. Đơn thức')).toBeInTheDocument()
    expect(screen.getByText('Phương pháp rút gọn')).toBeInTheDocument()
  })
})

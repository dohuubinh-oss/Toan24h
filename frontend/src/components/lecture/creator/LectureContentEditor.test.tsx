import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LectureContentEditor from './LectureContentEditor'
import { LectureCreatorProvider } from './LectureCreatorContext'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn() })
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('LectureContentEditor', () => {
  it('renders section title and embedded JsonInputCard', () => {
    render(
      <LectureCreatorProvider>
        <LectureContentEditor />
      </LectureCreatorProvider>
    )

    expect(screen.getByText('2. Phân tích bài tập mẫu')).toBeInTheDocument()
    expect(screen.getByText('Nhập nhanh bằng JSON')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Xử lý JSON/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Nhập JSON$/i })).not.toBeInTheDocument()
  })

  it('parses JSON input and updates lecture dangToanList', () => {
    render(
      <LectureCreatorProvider>
        <LectureContentEditor />
      </LectureCreatorProvider>
    )

    const textarea = screen.getByPlaceholderText(/Dạng 1\. Nhận biết đơn thức/i)
    const sampleJson = JSON.stringify([
      {
        mathType: 'Dạng 1. Đơn thức thử nghiệm',
        Solution: 'Lý thuyết đơn thức',
        exams: [{ problem: 'Ví dụ 1' }]
      }
    ])

    fireEvent.change(textarea, { target: { value: sampleJson } })
    fireEvent.click(screen.getByRole('button', { name: /Xử lý JSON/i }))

    expect(screen.getByDisplayValue('Dạng 1. Đơn thức thử nghiệm')).toBeInTheDocument()
  })
})

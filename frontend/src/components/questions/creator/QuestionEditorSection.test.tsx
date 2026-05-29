import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import QuestionEditorSection from './QuestionEditorSection'

describe('QuestionEditorSection Component', () => {
  it('renders all editor sections', () => {
    render(<QuestionEditorSection />)
    expect(screen.getByText('Nội dung dẫn chung (Shared Context)')).toBeInTheDocument()
    expect(screen.getByText('Nội dung câu hỏi')).toBeInTheDocument()
    expect(screen.getByText('Đáp án')).toBeInTheDocument()
    expect(screen.getByText('Lời giải chi tiết')).toBeInTheDocument()
    expect(screen.getByText('Thông tin bổ trợ cho học sinh')).toBeInTheDocument()
  })

  it('renders support fields', () => {
    render(<QuestionEditorSection />)
    expect(screen.getByText('Gợi ý')).toBeInTheDocument()
    expect(screen.getByText('Mẹo giải nhanh')).toBeInTheDocument()
    expect(screen.getByText('Phương pháp tổng quát')).toBeInTheDocument()
  })
})

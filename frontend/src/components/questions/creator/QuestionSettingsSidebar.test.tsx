import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import QuestionSettingsSidebar from './QuestionSettingsSidebar'

describe('QuestionSettingsSidebar Component', () => {
  it('renders settings fields', () => {
    render(<QuestionSettingsSidebar currentQuestion={{ grade: 8, cate: 'practice', book_name: 'Toán 8' } as any} />)
    expect(screen.getByText('Thiết lập câu hỏi')).toBeInTheDocument()
    expect(screen.getByText('Phân loại')).toBeInTheDocument()
    expect(screen.getByText('Tên Sách')).toBeInTheDocument()
    expect(screen.getByText('Khối lớp')).toBeInTheDocument()
    expect(screen.getByText('Chuyên đề')).toBeInTheDocument()
    expect(screen.getByText('Độ khó')).toBeInTheDocument()
    expect(screen.getByText('Thẻ (Tags)')).toBeInTheDocument()
  })

  it('renders smart process hint', () => {
    render(<QuestionSettingsSidebar />)
    expect(screen.getByText('Quy trình thông minh')).toBeInTheDocument()
  })
})


import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import QuestionSettingsSidebar from './QuestionSettingsSidebar'

describe('QuestionSettingsSidebar Component', () => {
  it('renders settings fields with Link Drive instead of Tên Sách', () => {
    render(<QuestionSettingsSidebar currentQuestion={{ grade: 8, cate: 'practice', gg_drive: 'https://drive.google.com/test' } as any} />)
    expect(screen.getByText('Thiết lập câu hỏi')).toBeInTheDocument()
    expect(screen.getByText('Phân loại')).toBeInTheDocument()
    expect(screen.getByText('Link Drive')).toBeInTheDocument()
    expect(screen.queryByText('Tên Sách')).not.toBeInTheDocument()
    expect(screen.getByText('Khối lớp')).toBeInTheDocument()
    expect(screen.getByText('Chuyên đề')).toBeInTheDocument()
    expect(screen.getByText('Độ khó')).toBeInTheDocument()
    expect(screen.getByText('Thẻ (Tags)')).toBeInTheDocument()

    // External link button should be present when gg_drive is a valid URL
    const driveLinks = screen.getAllByTitle('Mở tài liệu trên Google Drive')
    expect(driveLinks.length).toBeGreaterThan(0)
    expect(driveLinks[0]).toHaveAttribute('href', 'https://drive.google.com/test')
  })

  it('updates gg_drive when input changes', () => {
    const onUpdateMock = vi.fn()
    render(<QuestionSettingsSidebar currentQuestion={{ gg_drive: '' } as any} updateQuestion={onUpdateMock} />)

    const input = screen.getByPlaceholderText(/drive\.google\.com/i)
    fireEvent.change(input, { target: { value: 'https://drive.google.com/file/d/123' } })

    expect(onUpdateMock).toHaveBeenCalledWith('gg_drive', 'https://drive.google.com/file/d/123')
  })

  it('renders smart process hint', () => {
    render(<QuestionSettingsSidebar />)
    expect(screen.getByText('Quy trình thông minh')).toBeInTheDocument()
  })
})

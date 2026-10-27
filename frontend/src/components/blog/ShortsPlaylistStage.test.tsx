import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ShortsPlaylistStage } from './ShortsPlaylistStage'
import { ShortItem } from '@/data/blogData'

// Mock MathText component
vi.mock('@/components/ui/MathText', () => ({
  default: ({ content, className }: { content: string; className?: string }) => (
    <div data-testid="mock-mathtext" className={className}>
      {content}
    </div>
  )
}))

const mockShorts: ShortItem[] = [
  { id: '1', youtubeUrl: 'https://youtube.com/shorts/vid11111111', videoId: 'vid11111111', title: 'Mẹo Tích Phân', notes: 'Công thức tích phân hàm ẩn' },
  { id: '2', youtubeUrl: 'https://youtube.com/shorts/vid22222222', videoId: 'vid22222222', title: 'Mẹo Cực Trị', notes: 'Công thức cực trị bậc 3' }
]

describe('ShortsPlaylistStage', () => {
  it('renders initial video and synchronized notes', () => {
    render(<ShortsPlaylistStage shorts={mockShorts} postTitle="Chuỗi Shorts Casio" authorName="ThS. Nguyễn Văn An" />)
    expect(screen.getAllByText('Mẹo Tích Phân').length).toBeGreaterThan(0)
    expect(screen.getByText(/Công thức tích phân hàm ẩn/i)).toBeInTheDocument()
    const iframe = screen.getByTitle(/YouTube Shorts Player/i)
    expect(iframe).toHaveAttribute('src', expect.stringContaining('vid11111111'))
  })

  it('navigates to next and previous video updating notes and player', () => {
    render(<ShortsPlaylistStage shorts={mockShorts} postTitle="Chuỗi Shorts Casio" authorName="ThS. Nguyễn Văn An" />)
    const nextBtn = screen.getByRole('button', { name: /Tiếp theo/i })
    fireEvent.click(nextBtn)
    expect(screen.getAllByText('Mẹo Cực Trị').length).toBeGreaterThan(0)
    expect(screen.getByText(/Công thức cực trị bậc 3/i)).toBeInTheDocument()
    const iframe = screen.getByTitle(/YouTube Shorts Player/i)
    expect(iframe).toHaveAttribute('src', expect.stringContaining('vid22222222'))

    const prevBtn = screen.getByRole('button', { name: /Video trước/i })
    fireEvent.click(prevBtn)
    expect(screen.getByText(/Công thức tích phân hàm ẩn/i)).toBeInTheDocument()
  })

  it('selects video directly from thumbnail rail', () => {
    render(<ShortsPlaylistStage shorts={mockShorts} postTitle="Chuỗi Shorts Casio" authorName="ThS. Nguyễn Văn An" />)
    const secondThumb = screen.getByTestId('rail-item-1')
    fireEvent.click(secondThumb)
    expect(screen.getByText(/Công thức cực trị bậc 3/i)).toBeInTheDocument()
  })
})

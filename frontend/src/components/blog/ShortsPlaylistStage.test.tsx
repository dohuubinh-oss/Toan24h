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
  { id: '2', youtubeUrl: 'https://images.unsplash.com/photo-math.jpg', title: 'Ảnh Cheatsheet Cực Trị', notes: 'Công thức cực trị bậc 3' }
]

describe('ShortsPlaylistStage', () => {
  it('renders initial video and synchronized notes without inside-video nav buttons', () => {
    render(<ShortsPlaylistStage shorts={mockShorts} postTitle="Chuỗi Shorts Casio" authorName="ThS. Nguyễn Văn An" />)
    expect(screen.getAllByText('Mẹo Tích Phân').length).toBeGreaterThan(0)
    expect(screen.getByText(/Công thức tích phân hàm ẩn/i)).toBeInTheDocument()
    const iframe = screen.getByTitle(/YouTube Shorts Player/i)
    expect(iframe).toHaveAttribute('src', expect.stringContaining('vid11111111'))

    // Verify navigation buttons inside video are removed per user request
    expect(screen.queryByRole('button', { name: /Video trước/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Tiếp theo/i })).not.toBeInTheDocument()
  })

  it('switches between video and image item when clicking thumbnail rail', () => {
    render(<ShortsPlaylistStage shorts={mockShorts} postTitle="Chuỗi Shorts Casio" authorName="ThS. Nguyễn Văn An" />)
    
    // Click second item which is an image
    const secondThumb = screen.getByTestId('rail-item-1')
    fireEvent.click(secondThumb)

    expect(screen.getAllByText('Ảnh Cheatsheet Cực Trị').length).toBeGreaterThan(0)
    expect(screen.getByText(/Công thức cực trị bậc 3/i)).toBeInTheDocument()
    expect(screen.getByText('ẢNH BÀI HỌC')).toBeInTheDocument()
    // Image element rendered instead of iframe
    expect(screen.queryByTitle(/YouTube Shorts Player/i)).not.toBeInTheDocument()
  })

  it('supports keyboard navigation via arrow keys', () => {
    render(<ShortsPlaylistStage shorts={mockShorts} postTitle="Chuỗi Shorts Casio" authorName="ThS. Nguyễn Văn An" />)
    
    // Press ArrowRight to move to next item
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getAllByText('Ảnh Cheatsheet Cực Trị').length).toBeGreaterThan(0)

    // Press ArrowLeft to move back
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getAllByText('Mẹo Tích Phân').length).toBeGreaterThan(0)
  })
})

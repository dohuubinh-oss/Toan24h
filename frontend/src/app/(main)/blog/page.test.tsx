import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BlogListPage from './page'

vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  }
}))

vi.mock('@/data/blogData', async () => {
  const actual = await vi.importActual<any>('@/data/blogData')
  return {
    ...actual,
    BLOG_CATEGORIES: [
      { id: 'all', label: 'Tất cả bài viết' },
      { id: 'Bi-Quyet-Thi', label: 'Bí quyết thi vào 10' },
      { id: 'Meo-Casio', label: 'Mẹo Casio' },
    ],
    getBlogPosts: () => [
      {
        id: 'shorts-post-1',
        slug: 'playlist-casio-fx580vnx',
        title: 'Tuyển tập 5 mẹo bấm máy Casio fx-580VNX',
        postType: 'shorts_playlist',
        category: 'Meo-Casio',
        categoryLabel: 'Mẹo Casio',
        coverImage: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        author: { name: 'Thầy Bình', avatar: 'https://example.com/avt.jpg', role: 'Giáo viên' },
        publishedAt: '27/10/2026',
        readTime: '5 Shorts',
        tags: ['Casio', 'Shorts'],
        featured: true,
      },
      {
        id: 'standard-post-2',
        slug: 'bai-viet-chuan',
        title: 'Bí quyết ôn thi vào lớp 10 đạt điểm 9+',
        postType: 'standard',
        category: 'Bi-Quyet-Thi',
        categoryLabel: 'Bí quyết thi vào 10',
        coverImage: 'https://example.com/cover2.jpg',
        author: { name: 'Cô Lan', avatar: null, role: 'Giáo viên' },
        publishedAt: '26/10/2026',
        readTime: '5 phút đọc',
        tags: ['Luyện thi', 'Toán 9']
      }
    ]
  }
})

describe('BlogListPage with shorts playlist items', () => {
  it('displays playlist shorts badge on shorts posts', () => {
    render(<BlogListPage />)
    const badges = screen.queryAllByText(/Playlist Shorts/i)
    expect(badges.length).toBeGreaterThan(0)
  })

  it('renders THCS categories and search input with aria-label', () => {
    render(<BlogListPage />)
    expect(screen.getAllByText('Bí quyết thi vào 10').length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Tìm kiếm bài viết, chủ đề')).toBeInTheDocument()
  })

  it('filters posts by search query', () => {
    render(<BlogListPage />)
    const searchInput = screen.getByLabelText('Tìm kiếm bài viết, chủ đề')
    fireEvent.change(searchInput, { target: { value: 'Casio' } })

    expect(screen.getByText('Tuyển tập 5 mẹo bấm máy Casio fx-580VNX')).toBeInTheDocument()
  })

  it('shows empty state with reset button when no posts match', () => {
    render(<BlogListPage />)
    const searchInput = screen.getByLabelText('Tìm kiếm bài viết, chủ đề')
    fireEvent.change(searchInput, { target: { value: 'TuKhoaKhongTonTai12345' } })

    expect(screen.getByText('Không tìm thấy bài viết phù hợp')).toBeInTheDocument()
    const resetButton = screen.getByRole('button', { name: /Xem tất cả bài viết/i })
    expect(resetButton).toBeInTheDocument()

    // Clicking reset button clears search and restores list
    fireEvent.click(resetButton)
    expect(screen.getAllByText('Tuyển tập 5 mẹo bấm máy Casio fx-580VNX').length).toBeGreaterThan(0)
  })

  it('renders pagination component with item count when posts exist', () => {
    render(<BlogListPage />)
    expect(screen.getByText(/Hiển thị/i)).toBeInTheDocument()
    expect(screen.getByText(/trong số/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Trang trước')).toBeInTheDocument()
    expect(screen.getByLabelText('Trang sau')).toBeInTheDocument()
  })
})

import React from 'react'
import { render, screen } from '@testing-library/react'
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
        tags: ['Casio', 'Shorts']
      },
      {
        id: 'standard-post-2',
        slug: 'bai-viet-chuan',
        title: 'Bí quyết ôn thi THPT',
        postType: 'standard',
        category: 'Bi-Quyet-Thi',
        categoryLabel: 'Bí quyết thi THPT',
        coverImage: 'https://example.com/cover2.jpg',
        author: { name: 'Cô Lan', avatar: 'https://example.com/avt2.jpg', role: 'Giáo viên' },
        publishedAt: '26/10/2026',
        readTime: '5 phút đọc',
        tags: ['Luyện thi']
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
})

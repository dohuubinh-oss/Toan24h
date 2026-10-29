import React, { Suspense, act } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BlogDetailPage from './page'
import { ToastProvider } from '@/components/ui/ToastProvider'

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
        id: 'test-shorts',
        slug: 'playlist-casio-15s',
        title: 'Tuyển tập 10 Shorts Casio',
        postType: 'shorts_playlist',
        playlistData: JSON.stringify([
          { id: '1', youtubeUrl: 'https://youtube.com/shorts/vid12345678', videoId: 'vid12345678', title: 'Casio Vi-et', notes: 'Ghi chú số 1' }
        ]),
        category: 'Meo-Casio',
        categoryLabel: 'Mẹo Casio',
        coverImage: 'https://example.com/cover.jpg',
        author: { name: 'Thầy Bình', avatar: 'https://example.com/avt.jpg', role: 'Giáo viên' },
        publishedAt: '27/10/2026',
        readTime: '5 phút',
        tags: ['Casio']
      },
      {
        id: 'test-standard',
        slug: 'meo-giai-toan-9-vao-10',
        title: 'Bí quyết đạt điểm 9+ môn Toán vào 10',
        postType: 'standard',
        content: 'Nội dung bài viết hướng dẫn giải toán vào 10 chi tiết',
        category: 'Bi-Quyet-Thi',
        categoryLabel: 'Bí quyết thi vào 10',
        coverImage: 'https://example.com/standard-cover.jpg',
        author: { name: 'Cô Mai', avatar: null, role: 'Tổ trưởng Chuyên môn' },
        publishedAt: '26/10/2026',
        readTime: '6 phút',
        tags: ['Toán 9', 'Thi vào 10']
      }
    ]
  }
})

describe('BlogDetailPage', () => {
  it('renders ShortsPlaylistStage when postType is shorts_playlist', async () => {
    const params = Promise.resolve({ slug: 'playlist-casio-15s' })
    await act(async () => {
      render(
        <ToastProvider>
          <Suspense fallback={<div>Đang tải...</div>}>
            <BlogDetailPage params={params} />
          </Suspense>
        </ToastProvider>
      )
    })
    expect(screen.getAllByText('Casio Vi-et').length).toBeGreaterThan(0)
    expect(screen.getByText(/Ghi chú số 1/i)).toBeInTheDocument()
  })

  it('renders standard post with cover image, math content, and practice CTA banner', async () => {
    const params = Promise.resolve({ slug: 'meo-giai-toan-9-vao-10' })
    await act(async () => {
      render(
        <ToastProvider>
          <Suspense fallback={<div>Đang tải...</div>}>
            <BlogDetailPage params={params} />
          </Suspense>
        </ToastProvider>
      )
    })
    expect(screen.getAllByText('Bí quyết đạt điểm 9+ môn Toán vào 10').length).toBeGreaterThan(0)
    expect(screen.getByText(/Nội dung bài viết hướng dẫn giải toán vào 10/i)).toBeInTheDocument()

    // Cover image rendered
    const cover = screen.getByAltText('Bí quyết đạt điểm 9+ môn Toán vào 10')
    expect(cover).toBeInTheDocument()
    expect(cover).toHaveAttribute('src', 'https://example.com/standard-cover.jpg')

    // Practice banner CTA
    expect(screen.getByText(/Bạn muốn rèn luyện dạng toán này/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Luyện bài tập ngay/i })).toHaveAttribute('href', '/practices')

    // Back to blog list link
    expect(screen.getByRole('link', { name: /Quay lại danh sách Blog/i })).toHaveAttribute('href', '/blog')
  })

  it('renders 2-column academic portal layout with breadcrumb and sticky sidebar widgets', async () => {
    const params = Promise.resolve({ slug: 'meo-giai-toan-9-vao-10' })
    await act(async () => {
      render(
        <ToastProvider>
          <Suspense fallback={<div>Đang tải...</div>}>
            <BlogDetailPage params={params} />
          </Suspense>
        </ToastProvider>
      )
    })

    // Breadcrumb links
    expect(screen.getByRole('link', { name: 'Trang chủ' })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: 'Góc học tập & Blog' })).toHaveAttribute('href', '/blog')

    // Sidebar widgets
    expect(screen.getByText('Chuyên gia & Tác giả')).toBeInTheDocument()
    expect(screen.getByText('Trọng tâm bài giảng')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Vào phòng thi thử ngay/i })).toHaveAttribute('href', '/practices')
    expect(screen.getByText('Bài viết liên quan')).toBeInTheDocument()

    // Previous / Next post navigation
    expect(screen.getByText(/Bài viết trước/i)).toBeInTheDocument()
  })
})

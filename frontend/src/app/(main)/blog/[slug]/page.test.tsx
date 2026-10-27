import React, { Suspense, act } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BlogDetailPage from './page'
import { ToastProvider } from '@/components/ui/ToastProvider'

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
          { id: '1', youtubeUrl: 'https://youtube.com/shorts/vid12345678', videoId: 'vid12345678', title: 'Casio Tích Phân', notes: 'Ghi chú số 1' }
        ]),
        category: 'Meo-Casio',
        categoryLabel: 'Mẹo Casio',
        coverImage: 'https://example.com/cover.jpg',
        author: { name: 'Thầy Bình', avatar: 'https://example.com/avt.jpg', role: 'Giáo viên' },
        publishedAt: '27/10/2026',
        readTime: '5 phút',
        tags: ['Casio']
      }
    ]
  }
})

describe('BlogDetailPage with shorts_playlist', () => {
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
    expect(screen.getAllByText('Casio Tích Phân').length).toBeGreaterThan(0)
    expect(screen.getByText(/Ghi chú số 1/i)).toBeInTheDocument()
  })
})

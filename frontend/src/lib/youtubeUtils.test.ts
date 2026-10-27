import { describe, it, expect } from 'vitest'
import { extractYouTubeVideoId, parseShortsPlaylist, isImageUrl, getMediaThumbnail } from './youtubeUtils'

describe('youtubeUtils', () => {
  it('extracts 11-char videoId from various YouTube Shorts and standard URLs', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s')).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeVideoId('https://m.youtube.com/shorts/dQw4w9WgXcQ?feature=share')).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeVideoId('invalid-url')).toBe(null)
    expect(extractYouTubeVideoId('')).toBe(null)
  })

  it('safely parses valid and corrupted playlist JSON including image items', () => {
    const validJson = JSON.stringify([
      { id: '1', youtubeUrl: 'https://youtube.com/shorts/abc12345678', videoId: 'abc12345678', title: 'Tip 1', notes: 'Công thức A' },
      { id: '2', youtubeUrl: 'https://images.unsplash.com/photo-123.jpg', title: 'Ảnh Tip 2', notes: 'Ghi chú ảnh' }
    ])
    const parsed = parseShortsPlaylist(validJson)
    expect(parsed).toHaveLength(2)
    expect(parsed[0].videoId).toBe('abc12345678')
    expect(parsed[1].title).toBe('Ảnh Tip 2')
    expect(parseShortsPlaylist('')).toEqual([])
    expect(parseShortsPlaylist('corrupted json')).toEqual([])
    expect(parseShortsPlaylist(undefined)).toEqual([])
  })

  it('correctly detects image URLs and generates thumbnails', () => {
    expect(isImageUrl('https://example.com/photo.png')).toBe(true)
    expect(isImageUrl('https://images.unsplash.com/photo-12345')).toBe(true)
    expect(isImageUrl('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe(false)

    expect(getMediaThumbnail({ videoId: 'dQw4w9WgXcQ' })).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg')
    expect(getMediaThumbnail({ youtubeUrl: 'https://example.com/banner.jpg' })).toBe('https://example.com/banner.jpg')
  })
})

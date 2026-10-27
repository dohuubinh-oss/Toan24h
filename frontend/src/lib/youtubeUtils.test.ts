import { describe, it, expect } from 'vitest'
import { extractYouTubeVideoId, parseShortsPlaylist } from './youtubeUtils'

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

  it('safely parses valid and corrupted playlist JSON', () => {
    const validJson = JSON.stringify([
      { id: '1', youtubeUrl: 'https://youtube.com/shorts/abc12345678', videoId: 'abc12345678', title: 'Tip 1', notes: 'Công thức A' }
    ])
    expect(parseShortsPlaylist(validJson)).toHaveLength(1)
    expect(parseShortsPlaylist(validJson)[0].videoId).toBe('abc12345678')
    expect(parseShortsPlaylist('')).toEqual([])
    expect(parseShortsPlaylist('corrupted json')).toEqual([])
    expect(parseShortsPlaylist(undefined)).toEqual([])
  })
})

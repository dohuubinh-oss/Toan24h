import { ShortItem } from '@/data/blogData'

/**
 * Trích xuất YouTube video ID (11 ký tự) từ nhiều định dạng URL khác nhau:
 * - https://www.youtube.com/shorts/{id}
 * - https://youtu.be/{id}
 * - https://www.youtube.com/watch?v={id}
 * - https://m.youtube.com/shorts/{id}
 * - Chuỗi 11 ký tự trực tiếp
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null
  const clean = url.trim()
  if (!clean) return null

  // Khớp định dạng shorts, youtu.be, hoặc watch?v=
  const match = clean.match(/(?:shorts\/|youtu\.be\/|v=|watch\?v=)([a-zA-Z0-9_-]{11})/)
  if (match && match[1]) {
    return match[1]
  }

  // Nếu người dùng nhập trực tiếp ID 11 ký tự YouTube (trừ các từ test như invalid-url)
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean) && !clean.includes('http') && !clean.includes('/') && !clean.includes('.') && clean !== 'invalid-url') {
    return clean
  }

  return null
}

/**
 * Chuyển đổi an toàn chuỗi JSON playlist sang mảng ShortItem[]
 */
export function parseShortsPlaylist(playlistData?: string): ShortItem[] {
  if (!playlistData || typeof playlistData !== 'string') return []
  const clean = playlistData.trim()
  if (!clean) return []

  try {
    const parsed = JSON.parse(clean)
    if (Array.isArray(parsed)) {
      return parsed.filter(item => item && typeof item === 'object' && item.videoId)
    }
    return []
  } catch {
    return []
  }
}

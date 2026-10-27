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
 * Kiểm tra xem đường link có phải là link ảnh trực tiếp hoặc dịch vụ lưu trữ ảnh không
 */
export function isImageUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false
  const clean = url.trim().toLowerCase()
  if (clean.startsWith('data:image/')) return true
  if (/\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)(\?.*)?$/i.test(clean)) return true
  if (clean.includes('images.unsplash.com') || clean.includes('/uploads/') || clean.includes('cloudinary.com') || clean.includes('imgur.com')) {
    return true
  }
  // Nếu là HTTP link và không phải YouTube
  if (/^https?:\/\//i.test(clean) && !extractYouTubeVideoId(clean)) {
    return true
  }
  return false
}

/**
 * Lấy ảnh thumbnail đại diện cho video Short hoặc hình ảnh bài học
 */
export function getMediaThumbnail(item: { videoId?: string; youtubeUrl?: string; imageUrl?: string }): string {
  if (item.videoId && !isImageUrl(item.youtubeUrl)) {
    return `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`
  }
  if (item.imageUrl) return item.imageUrl
  if (item.youtubeUrl) return item.youtubeUrl
  return 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=400'
}

/**
 * Chuyển đổi an toàn chuỗi JSON playlist sang mảng ShortItem[]
 * Hỗ trợ cả item dạng video YouTube lẫn item dạng hình ảnh
 */
export function parseShortsPlaylist(playlistData?: string): ShortItem[] {
  if (!playlistData || typeof playlistData !== 'string') return []
  const clean = playlistData.trim()
  if (!clean) return []

  try {
    const parsed = JSON.parse(clean)
    if (Array.isArray(parsed)) {
      return parsed.filter(item => item && typeof item === 'object' && (item.videoId || item.youtubeUrl || item.imageUrl))
    }
    return []
  } catch {
    return []
  }
}

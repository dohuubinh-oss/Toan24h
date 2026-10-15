import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Trích xuất ký tự viết tắt đại diện cho avatar theo quy chuẩn tiếng Việt.
 * Lấy ký tự đầu tiên của từ cuối cùng (tên gọi) và chuyển thành chữ in hoa.
 * Ví dụ: "Nguyễn Văn An" -> "A", "Trần Thị Bích Ngọc" -> "N", "9A" -> "9".
 */
export function getAvatarInitial(name?: string | null, fallback = 'U'): string {
  if (!name) return fallback
  const trimmed = name.trim()
  if (!trimmed) return fallback

  const parts = trimmed.split(/\s+/)
  const lastPart = parts[parts.length - 1]
  if (!lastPart) return fallback

  // Lọc bỏ ký tự mở ngoặc, nháy kép hoặc dấu câu ở đầu từ nếu có (ví dụ: "(Nam)" -> "Nam")
  const cleaned = lastPart.replace(/^[^\p{L}\p{N}]+/u, '')
  if (!cleaned) return lastPart.charAt(0).toUpperCase() || fallback

  return cleaned.charAt(0).toUpperCase()
}


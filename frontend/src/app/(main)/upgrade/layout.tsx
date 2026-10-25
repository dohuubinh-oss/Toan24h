import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bảng Giá & Gói Thành Viên VIP Học Toán THCS',
  description: 'Đăng ký gói VIP toan6789.vn mở khóa trọn bộ 10.000+ đề thi chọn lọc, chấm bài tự luận không giới hạn bằng AI và phòng luyện thi nâng cao điểm số.',
  alternates: {
    canonical: '/upgrade',
  },
  openGraph: {
    title: 'Nâng Cấp Gói VIP toan6789.vn - Bứt Phá Điểm 9+ Môn Toán',
    description: 'Chấm tự luận bằng AI, mở khóa kho đề thi chất lượng cao và giải thích chi tiết từng bước.',
  },
}

export default function UpgradeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

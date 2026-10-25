import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Góc Học Tập & Bí Quyết Luyện Thi Toán THCS',
  description: 'Tổng hợp kinh nghiệm học giỏi Toán, mẹo làm bài trắc nghiệm và tự luận, phương pháp giải các dạng toán thi vào lớp 10 bám sát chương trình mới.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Góc Học Tập & Bí Quyết Luyện Thi Toán THCS | toan6789.vn',
    description: 'Bí quyết đạt điểm 9+ môn Toán THCS từ các thầy cô chuyên môn và thủ khoa.',
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

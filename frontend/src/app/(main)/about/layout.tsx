import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Về Chúng Tôi - Sứ Mệnh & Đội Ngũ | toan6789.vn',
  description:
    'Tìm hiểu về sứ mệnh cách mạng hóa học Toán THCS của toan6789.vn, đội ngũ giáo viên chuyên môn và công nghệ trợ lý học tập MathAI.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'Về Chúng Tôi - Sứ Mệnh & Đội Ngũ | toan6789.vn',
    description:
      'Nền tảng học và luyện thi Toán THCS bám sát chương trình mới cùng đội ngũ giáo viên chuyên môn và trợ lý học tập thông minh MathAI.',
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

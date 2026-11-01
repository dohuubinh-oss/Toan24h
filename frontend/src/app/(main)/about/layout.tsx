import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Về Chúng Tôi & Chương Trình Đối Tác Affiliate 30% | toan6789.vn',
  description:
    'Tìm hiểu về sứ mệnh cách mạng hóa học Toán THCS của toan6789.vn và tham gia chương trình Đối tác Affiliate nhận ngay 30% hoa hồng trên mọi đơn hàng nâng cấp.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'Về Chúng Tôi & Chương Trình Đối Tác Affiliate 30% | toan6789.vn',
    description:
      'Nền tảng học Toán THCS thông minh tích hợp MathAI. Tham gia mạng lưới đối tác toan6789.vn và nhận 30% hoa hồng chia sẻ doanh thu hấp dẫn.',
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

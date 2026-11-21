import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chính sách & Điều khoản Dịch vụ Giáo dục | toan6789.vn',
  description:
    'Quy chế định danh sản phẩm Khóa học trực tuyến, Dịch vụ hỗ trợ giáo dục và công nghệ Chấm bài tự động tại toan6789.vn.',
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

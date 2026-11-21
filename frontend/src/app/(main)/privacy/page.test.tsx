import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PrivacyPolicyPage from './page'

describe('PrivacyPolicyPage - Decree 13/2023/ND-CP Compliance', () => {
  it('renders privacy policy heading and legal framework', () => {
    render(<PrivacyPolicyPage />)
    expect(
      screen.getByRole('heading', {
        name: /Chính Sách Bảo Mật Quyền Riêng Tư & Bảo Vệ Dữ Liệu Cá Nhân/i,
      })
    ).toBeInTheDocument()
    expect(screen.getAllByText(/Nghị định 13\/2023\/NĐ-CP/i).length).toBeGreaterThanOrEqual(1)
  })

  it('contains the mandatory 72-hour account deletion and data anonymization commitment', () => {
    render(<PrivacyPolicyPage />)
    expect(
      screen.getByText(
        /Khi người dùng yêu cầu xóa tài khoản, chúng tôi cam kết hủy bỏ toàn bộ dữ liệu định danh và hình ảnh bài làm trong vòng 72 giờ làm việc, hệ thống chỉ giữ lại các dữ liệu điểm số đã được ẩn danh hoàn toàn nhằm mục đích thống kê chung\./i
      )
    ).toBeInTheDocument()
  })

  it('outlines hard-delete physical cleanup procedures', () => {
    render(<PrivacyPolicyPage />)
    expect(screen.getByText(/Quy trình Xóa Vật Lý \(Hard delete\) được thực thi:/i)).toBeInTheDocument()
    expect(screen.getByText(/Quét sạch và xóa vật lý toàn bộ các file ảnh bài làm tự luận/i)).toBeInTheDocument()
  })
})

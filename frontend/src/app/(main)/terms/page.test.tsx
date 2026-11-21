import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import TermsPage from './page'

describe('TermsPage - Ministry of Industry and Trade (BCT) Standard Compliance', () => {
  it('renders all 8 core articles required by BCT', () => {
    render(<TermsPage />)
    expect(screen.getByRole('heading', { name: /Điều 1: Chấp Thuận Điều Khoản và Độ Tuổi Sử Dụng/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Điều 2: Mô Tả Dịch Vụ và Chính Sách Trí Tuệ Nhân Tạo \(AI\)/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Điều 3: Quy Định về Đăng Ký và Bảo Mật Tài Khoản/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Điều 4: Sở Hữu Trí Tuệ và Bản Quyền/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Điều 5: Chính Sách Thanh Toán và Kích Hoạt Dịch Vụ/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Điều 6: Chính Sách Hoàn Tiền/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Điều 7: Hành Vi Bị Cấm và Trách Nhiệm Dữ Liệu Tải Lên/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Điều 8: Giải Quyết Tranh Chấp và Luật Áp Dụng/i })).toBeInTheDocument()
  })

  it('contains the complete legal AI disclaimer clause with Google API and no training guarantee', () => {
    render(<TermsPage />)
    expect(screen.getByText(/Giao diện lập trình ứng dụng \(API\) Trí tuệ nhân tạo do bên thứ ba \(Google\) cung cấp/i)).toBeInTheDocument()
    expect(screen.getByText(/chúng tôi không bảo đảm tính chính xác, đầy đủ hoặc phù hợp tuyệt đối 100%/i)).toBeInTheDocument()
    expect(screen.getByText(/tuyệt đối không được sử dụng để huấn luyện \(train\) các mô hình AI công cộng/i)).toBeInTheDocument()
  })

  it('contains the strict no-refund policy for digital access required by BCT', () => {
    render(<TermsPage />)
    expect(screen.getByText(/áp dụng chính sách/i)).toBeInTheDocument()
    expect(screen.getByText('KHÔNG HOÀN TIỀN')).toBeInTheDocument()
    expect(
      screen.getByText(/trừ trường hợp lỗi kỹ thuật phát sinh từ phía máy chủ của chúng tôi khiến người dùng không thể truy cập dịch vụ quá 48 giờ/i)
    ).toBeInTheDocument()
  })

  it('contains single-user account rule and dispute resolution', () => {
    render(<TermsPage />)
    expect(screen.getByText(/duy nhất 01 cá nhân/i)).toBeInTheDocument()
    expect(screen.getByText(/Tòa án nhân dân có thẩm quyền tại Việt Nam/i)).toBeInTheDocument()
  })

  it('contains third-party embedded resources and copyright disclaimer', () => {
    render(<TermsPage />)
    expect(screen.getByText(/Tài nguyên và nội dung bên thứ ba:/i)).toBeInTheDocument()
    expect(
      screen.getByText(
        /Hệ thống có thể sử dụng tính năng nhúng \(embed\) các tài liệu, video từ các nền tảng bên thứ ba \(như YouTube, Facebook\) nhằm mục đích minh họa giáo dục\./i
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /Bản quyền của các nội dung này thuộc về tác giả gốc\. Chúng tôi không sở hữu, không lưu trữ và không chịu trách nhiệm về bất kỳ thay đổi nội dung nào từ nguồn phát gốc\./i
      )
    ).toBeInTheDocument()
  })

  it('contains non-monetary policy for points, badges, and virtual items', () => {
    render(<TermsPage />)
    expect(screen.getByText(/Chính sách Điểm số, Huy hiệu và Vật phẩm ảo:/i)).toBeInTheDocument()
    expect(
      screen.getByText(
        /Điểm số, huy hiệu và các vật phẩm ảo trên hệ thống chỉ có giá trị ghi nhận thành tích học tập nội bộ, không có giá trị quy đổi thành tiền mặt, thẻ cào, hay tài sản thực tế dưới bất kỳ hình thức nào\./i
      )
    ).toBeInTheDocument()
  })

  it('contains privacy policy commitment on account deletion under Decree 13/2023/ND-CP', () => {
    render(<TermsPage />)
    expect(screen.getByText(/Chính sách Bảo mật Dữ liệu & Quyền xóa tài khoản vĩnh viễn/i)).toBeInTheDocument()
    expect(
      screen.getByText(
        /Khi người dùng yêu cầu xóa tài khoản, chúng tôi cam kết hủy bỏ toàn bộ dữ liệu định danh và hình ảnh bài làm trong vòng 72 giờ làm việc, hệ thống chỉ giữ lại các dữ liệu điểm số đã được ẩn danh hoàn toàn nhằm mục đích thống kê chung\./i
      )
    ).toBeInTheDocument()
  })

  it('contains copyright infringement handling policy and 48-hour takedown commitment', () => {
    render(<TermsPage />)
    expect(screen.getByText(/Chính sách xử lý vi phạm bản quyền & Quy trình gỡ bỏ/i)).toBeInTheDocument()
    expect(
      screen.getByText(
        /Chúng tôi luôn tôn trọng quyền Sở hữu trí tuệ\. Một số tài nguyên trên hệ thống được sưu tầm từ Internet với tác giả khuyết danh nhằm mục đích chia sẻ kiến thức\./i
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /Chúng tôi cam kết sẽ kiểm tra và gỡ bỏ nội dung vi phạm ngay lập tức trong vòng 48 giờ làm việc kể từ khi nhận được yêu cầu hợp lệ\./i
      )
    ).toBeInTheDocument()
    const supportLinks = screen.getAllByRole('link', { name: 'support@toan6789.vn' })
    expect(supportLinks.length).toBeGreaterThanOrEqual(1)
    expect(supportLinks[0]).toHaveAttribute('href', 'mailto:support@toan6789.vn')
  })
})

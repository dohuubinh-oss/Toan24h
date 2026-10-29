# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Học sinh Tiểu học & THCS (Khối 5, 6, 7, 8, 9):** Học sinh Lớp 5 ôn tập kiến thức nền tảng và luyện đề thi chuyển cấp vào Lớp 6 chất lượng cao; học sinh Khối 6, 7, 8, 9 ôn tập kiến thức môn Toán theo khung chương trình GDPT mới, luyện đề thi giữa kỳ, cuối kỳ và thi tuyển sinh vào lớp 10. Cần trải nghiệm thi thử trực chiến có bấm giờ, chấm điểm tự động, lời giải chi tiết từng bước (KaTeX) và môi trường thi tập trung không xao nhãng.
- **Phụ huynh học sinh:** Theo dõi tiến độ học tập, chuỗi ngày học liên tục (streak) và bảng điểm của con thông qua kênh liên kết tự động Telegram Bot; đăng ký và gia hạn các gói học tập VIP (1, 3, 6, 12 tháng) qua mã quét VietQR.
- **Giáo viên & Đội ngũ Soạn đề (Staff):** Xây dựng và quản lý Ngân hàng câu hỏi Toán học; soạn thảo công thức với KaTeX/MathLive; chụp ảnh hình vẽ/bài viết tay từ điện thoại chuyển thẳng lên web qua Mobile QR; kiểm tra câu hỏi mồ côi (orphan check); chấm bài tự luận (`needs-review`) và thẩm định đơn phúc khảo (`appeals`).

## Product Purpose

- `toan6789.vn` là nền tảng số hóa học tập và thi thử trực tuyến chuyên sâu cho môn Toán bậc Tiểu học chuyển cấp & Trung học Cơ sở (Lớp 5 đến Lớp 9).
- **Mục đích tồn tại:** Giải quyết bài toán thiếu hụt công cụ luyện thi Toán chuyên biệt từ Lớp 5 đến Lớp 9, xóa bỏ rào cản hiển thị công thức toán học phức tạp trên nền tảng số, và cung cấp môi trường phòng thi thực chiến chuẩn quy chế cho học sinh toàn quốc.
- **Định nghĩa thành công:** Học sinh nâng cao điểm số và năng lực giải quyết vấn đề môn Toán; tỷ lệ hoàn thành đề thi cao; hệ thống chịu tải mượt mà khi hơn 1,000 học sinh tham gia thi thử đồng thời (Spike Traffic).

## Positioning

`toan6789.vn` không phải là một hệ thống trắc nghiệm chung chung, mà được thiết kế chuyên biệt cho môn Toán với các cơ chế cốt lõi khác biệt:
1. **Hiển thị Toán học Chuyên sâu:** Tích hợp engine KaTeX và MathLive cho phép kết xuất chuẩn xác 100% các biểu thức toán học (phân số, căn bậc hai, ma trận, hệ phương trình, ký hiệu hình học).
2. **Phòng thi Chống Gian lận Thực chiến:** Triệt tiêu hoàn toàn gian lận qua DevTools bằng cách giấu trường đáp án đúng `correct_option` trên Server; phát hiện sự kiện thoát fullscreen / chuyển tab và ghi nhận nhật ký bất đồng bộ qua hàng đợi Redis Queue tốc độ cao.
3. **Đồng bộ Ảnh Không Dây qua Mobile QR:** Giáo viên và học sinh dùng điện thoại quét mã QR để chụp ảnh hình vẽ hình học hoặc bài làm viết tay tải trực tiếp vào ô soạn thảo trên máy tính.
4. **Cổng Thanh toán VietQR Napas Tự động (PayOS):** Tạo mã thanh toán động và tự động kích hoạt tài khoản VIP tức thì trong 3 giây qua Webhook có chữ ký số bảo mật HMAC SHA256.

## Operating Context

- **Môi trường Phòng thi (Desktop & Laptop):** Chế độ toàn màn hình (Fullscreen Exam Mode) tối giản thanh điều hướng để học sinh tập trung làm bài, có đồng hồ đếm ngược và cơ chế tự động nộp bài khi hết giờ.
- **Môi trường Ôn tập & Luyện bài (Responsive Mobile/Tablet):** Hỗ trợ học sinh duyệt bài giảng lý thuyết, lưu bài giảng yêu thích (bookmark) và giải nhanh câu hỏi chuyên đề trên điện thoại.
- **Kênh Thông báo Ngoại vi (Telegram Bot):** Gửi báo cáo kết quả thi và cảnh báo vi phạm về thiết bị di động của phụ huynh mà không phụ thuộc vào ứng dụng thứ ba.

## Capabilities and Constraints

### Chức năng Đã xác thực (Capabilities)
- Phân loại ngân hàng câu hỏi theo 5 khối lớp (5, 6, 7, 8, 9), các phân môn (Số học, Đại số, Hình học, Thống kê & Xác suất) và 4 cấp độ nhận thức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao).
- Hỗ trợ câu hỏi trắc nghiệm đơn, trắc nghiệm nhiều đáp án và câu hỏi tự luận nhập văn bản/ảnh.
- Bóc tách đề thi từ ảnh scan bằng AI OCR và tinh chỉnh hình vẽ hình học thành vector SVG sắc nét.
- Cơ chế chấm điểm in-memory siêu tốc kết hợp quy trình duyệt bài tự luận (`needs-review`) và khiếu nại phúc khảo kết quả (`appeals`).
- Bảng xếp hạng tuần (Leaderboard) thời gian thực bằng cấu trúc dữ liệu Redis Sorted Sets.
- **Tiến độ học tập có điều kiện (Mastery Progression):** Mỗi bài giảng có các bài luyện tập; bài giảng được coi là Hoàn thành khi học sinh đạt Điểm trung bình các bài tập thường $\ge 7.0$ và tất cả các bài tập thường đạt điểm qua $\ge 6.0$ (loại trừ các đề có tag Học sinh giỏi / Chuyên). Hoàn thành bài giảng trước sẽ mở khóa bài giảng kế tiếp trong lộ trình học.

### Ràng buộc Bắt buộc (Constraints)
- **Bảo mật đề thi:** Đáp án đúng tuyệt đối không bao giờ được gửi qua API học sinh trước khi nộp bài.
- **Bảo vệ Gói học & Bản quyền 1 Khối lớp (Single-Grade Account Enrollment):** Mỗi tài khoản học sinh chỉ được theo học đúng khối lớp đã đăng ký để cá nhân hóa lộ trình và ngăn chặn việc dùng chung 1 tài khoản cho nhiều con em ở các khối lớp khác nhau. Khi học sinh truy cập ngoài khối lớp, hệ thống hiển thị thông điệp thân thiện định hướng học sinh về đúng khối lớp của mình hoặc chuyển đổi chính thức.
- **Chịu tải cao (Spike Write):** Toàn bộ sự kiện chuyển tab chống gian lận phải đi qua Redis Queue (`LPUSH`) trước khi Worker gom batch bulk-insert vào PostgreSQL để không khóa kết nối CSDL.
- **Bảo mật phiên:** Sử dụng Stateless JWT lưu trong `HttpOnly, Secure, SameSite=Lax` Cookie.

## Brand Commitments

- **Tên thương hiệu:** `toan6789.vn`
- **Hệ thống Thiết kế:** **Modern Academic (Google Material Inspired)** theo chuẩn [`DESIGN.md`](file:///Users/modeptrai/Desktop/toan6789.vn/DESIGN.md).
- **Bảng màu Nhận diện:**
  - Màu chủ đạo (Primary): `#2563EB` (Royal Blue)
  - Nền & Mặt phẳng (Surface): `#F8FAFC` & `#FFFFFF`
  - Màu chữ (Ink / On-Surface): `#0F172A`
  - Viền mờ (Outline): `rgba(226, 232, 240, 0.6)`
  - Màu trạng thái: Thành công `#16A34A`, Cảnh báo `#D97706`, Lỗi `#EF4444`
- **Typography:**
  - Giao diện & Tiếng Việt: Phông `Lexend`
  - Công thức Toán học: Phông serif chuyên biệt (`Times New Roman` / `KaTeX Fonts`)
  - Mã đơn hàng & Thông số: Phông monospace `JetBrains Mono`

## Evidence on Hand

- Toàn bộ sơ đồ luồng nghiệp vụ tương tác trực quan: [`docs/toan6789-flows.html`](file:///Users/modeptrai/Desktop/toan6789.vn/docs/toan6789-flows.html) và thư mục [`docs/diagrams/`](file:///Users/modeptrai/Desktop/toan6789.vn/docs/diagrams/).
- Tài liệu kiến trúc phân tầng chịu tải cao: [`ARCHITECTURE.md`](file:///Users/modeptrai/Desktop/toan6789.vn/ARCHITECTURE.md).
- Tài liệu đặc tả luồng ứng dụng chi tiết: [`docs/application-flows.md`](file:///Users/modeptrai/Desktop/toan6789.vn/docs/application-flows.md).
- Bộ mã thiết kế hệ thống và token: [`DESIGN.md`](file:///Users/modeptrai/Desktop/toan6789.vn/DESIGN.md).

## Product Principles

1. **Chuẩn xác Học thuật (Academic Rigor):** Mọi công thức toán học và biểu đồ hình học phải hiển thị sắc nét, tuân thủ tuyệt đối quy chuẩn ký hiệu của Bộ Giáo dục & Đào tạo.
2. **Minh bạch & Công bằng (Integrity & Fairness):** Quy chế phòng thi được thực thi nghiêm ngặt; học sinh luôn có quyền phúc khảo công khai nếu có sai sót.
3. **Trải nghiệm Thi Tối giản (Distraction-Free Focus):** Giảm thiểu tối đa các hiệu ứng thừa trong phòng thi để học sinh dồn toàn bộ tâm trí vào việc giải toán.
4. **Đột phá Tiện ích (Pragmatic Innovation):** Ứng dụng công nghệ thiết thực (Mobile QR Sync, AI OCR bóc tách đề) để giảm tải tối đa thời gian soạn bài cho giáo viên.

## Accessibility & Inclusion

- Tuân thủ chuẩn cỡ chữ tối thiểu `12px` (text-xs) theo hướng dẫn Google Legibility.
- Vùng chạm (touch target) trên thiết bị di động luôn đạt tối thiểu `44x44px` đến `48x48px`.
- Độ tương phản màu văn bản và màu nền đảm bảo tỷ lệ tối thiểu 4.5:1 (đạt chuẩn WCAG 2.x AA).

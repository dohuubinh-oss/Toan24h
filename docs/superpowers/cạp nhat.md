trang quản lý người dùng:
- đang dùng mockdata, hãy dùng giữ liêu thật

- thêm trường trạng thái : hoạt động, bị khoá, gia hạn( cần nạp tiền để tiếp tục hoạt đông)
- thêm logic chuyển sang bị khoá khi ấn vào nút xoá
- tôi muốn thêm logic khi người dùng nạp tiền , thi trạng thái từ gia hạn sang hoạt động, và thêm trường để đến thời gian đó tự chuyển trạng thái về gia hạn, có thông báp cần nạp tiền trước 3 ngày hết hạn mỗi khi người dùng đăng nhập, nếu có đề xuất nào hay hơn thì gọi ý cho mình nhé
dùng quy trình superpower nhé



Quản lý người dùng & Logic Gia hạn (Subscription)
Dựa trên yêu cầu của bạn, mình đã khảo sát hệ thống backend (Go/Gorm) và frontend (Next.js) hiện tại. Dưới đây là kế hoạch chi tiết cũng như các đề xuất tối ưu (đúng theo quy trình Superpowers).

Đề xuất tối ưu (Suggestions)
Về thông báo sắp hết hạn (dưới 3 ngày):
Thay vì chỉ hiển thị một thông báo bật lên một lần lúc đăng nhập (dễ bị người dùng bấm tắt qua), chúng ta nên trả về trường expiresAt trong thông tin me (hoặc thông tin User) khi đăng nhập.
Frontend sẽ tự động tính toán số ngày còn lại. Nếu < 3 ngày, hiển thị một Banner cố định ở góc trên cùng hoặc trang chủ để nhắc nhở người dùng nạp tiền liên tục cho đến khi họ thực sự nạp.
Về chức năng Nạp tiền (Recharge):
Trên trang "Quản lý người dùng" (Admin), nên có một nút/menu "Nạp tiền/Gia hạn" để Admin có thể cộng thêm số tháng sử dụng (ví dụ: +1 tháng, +6 tháng, +12 tháng) thay vì nhập ngày thủ công, giúp tránh sai sót.
Quản lý trạng thái tự động:
Khi expiresAt vượt qua thời điểm hiện tại, trạng thái tự động bị coi là gia hạn (expired) ngay cả khi database vẫn ghi là active. Bằng cách này, chúng ta không cần viết cronjob backend để quét mỗi ngày (đỡ tốn tài nguyên server), chỉ cần kiểm tra logic lúc request API.
Open Questions (Câu hỏi cần bạn xác nhận)
WARNING

Vui lòng cho mình biết ý kiến của bạn về các vấn đề sau trước khi tiến hành code:

Khóa tài khoản (Lock) vs Hết hạn (Expire): Khi người dùng hết hạn, họ chỉ bị chặn thi/làm bài nhưng vẫn vào được trang web đúng không? Còn khi ấn nút "Xóa" (khóa tài khoản) thì họ sẽ bị đăng xuất và không thể đăng nhập được nữa?
Thời gian nạp mặc định: Bạn muốn Admin nhập số tháng gia hạn, hay chọn một mốc ngày cụ thể?
Banner thông báo: Bạn có đồng ý với cách dùng Banner cảnh báo thường trực trên Frontend thay vì chỉ alert một lần lúc login không?
Proposed Changes (Chi tiết kỹ thuật)
1. Database & Backend Models
Thêm các trường mới vào model User.

[MODIFY] backend/internal/models/user.go
Thêm Status string (default: 'active', có thể là 'active', 'locked', 'expired').
Thêm ExpiresAt *time.Time (chứa thời hạn sử dụng gói).
2. Backend API Endpoints (Admin)
Tạo thêm các routes và handler cho User Management.

[NEW] backend/internal/handlers/user_handler.go
GET /api/v1/users: API lấy danh sách user, có hỗ trợ phân trang (page, limit), tìm kiếm (q) và lọc theo role, status.
PUT /api/v1/users/:id/status: Đổi trạng thái user (từ active sang locked - dùng cho nút Xóa).
POST /api/v1/users/:id/recharge: Nạp thêm thời hạn (nhận vào body months, tự động cộng thêm vào ExpiresAt và đổi status sang active).
[MODIFY] backend/internal/routes/routes.go
Đăng ký các endpoints trên vào group API protected (cần quyền Admin).
[MODIFY] backend/internal/handlers/auth_handler.go
Cập nhật logic Login: Nếu user có trạng thái là locked, từ chối đăng nhập. Nếu ExpiresAt đã qua thời điểm hiện tại, trả về status expired (dù database chưa update) để Frontend xử lý.
3. Frontend UI (Trang quản lý)
Đổi từ mock data sang gọi API thật.

[MODIFY] frontend/src/app/(main)/dashboard/users/page.tsx
Thay thế INITIAL_MOCK_USERS bằng việc fetch GET /api/v1/users.
Cập nhật UI bảng để hiển thị trạng thái bằng các badge màu: Xanh (Hoạt động), Đỏ (Bị khóa), Vàng/Cam (Gia hạn).
Thay vì xóa hẳn (Delete), nút Thùng rác sẽ gọi PUT /api/v1/users/:id/status với status = locked.
Thêm nút "Gia hạn" (Biểu tượng Dollar hoặc Đồng hồ) cho phép Admin nhập số tháng và gọi API Recharge.
4. Frontend UI (Thông báo sắp hết hạn)
Tích hợp logic Banner cho sinh viên.

[MODIFY] Component Layout chính hoặc Trang Dashboard Học sinh
Đọc expiresAt từ thông tin User.
Tính khoảng cách ngày: Nếu 0 < days <= 3, hiện Banner: "Tài khoản của bạn sẽ hết hạn sau X ngày. Vui lòng nạp tiền để không bị gián đoạn."
Nếu days <= 0, hiện thông báo "Tài khoản đã hết hạn, vui lòng nạp tiền" và vô hiệu hóa các nút làm bài thi.
Bạn hãy phản hồi các câu hỏi ở phần "Open Questions", hoặc duyệt kế hoạch để mình bắt đầu triển khai ngay!
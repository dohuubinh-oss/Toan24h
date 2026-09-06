# Cải tiến luồng xác thực và phân quyền

Dưới đây là các đề xuất nhằm nâng cấp luồng xác thực và phân quyền của hệ thống Toan24h lên mức bảo mật chuẩn doanh nghiệp (Enterprise-level):

### 1. Vá lỗ hổng CSRF & Nâng cấp bảo mật Cookie
Vì hệ thống đang lưu JWT vào Cookie, nó tự động thừa hưởng nguy cơ bị tấn công **CSRF (Cross-Site Request Forgery)**.
- **Vấn đề hiện tại:** Trong hàm `SetCookie` của Gin, tham số `secure` đang là `false` (cho phép chạy qua HTTP thường) và chưa cấu hình `SameSite`.
- **Giải pháp đề xuất:** 
  - Đổi `secure = true` trên môi trường Production (chỉ cho phép truyền qua HTTPS).
  - Bắt buộc cấu hình thuộc tính **`SameSite=Strict`** (hoặc `Lax`) cho cookie. Trong Gin, cần gọi `c.SetSameSite(http.SameSiteStrictMode)` trước khi `SetCookie` để trình duyệt từ chối gửi token này nếu request xuất phát từ một domain khác.

### 2. Quản lý Đăng xuất (Logout) triệt để bằng Blacklist (với Redis)
- **Vấn đề hiện tại:** Nút Logout hiện tại chỉ xóa Cookie trên trình duyệt. Do JWT là *stateless*, chuỗi token đó thực tế **vẫn còn giá trị hiệu lực** trên Server cho đến khi hết hạn (1 ngày). Nếu hacker trộm được token này, họ vẫn có thể gọi API bình thường.
- **Giải pháp đề xuất:** Kết hợp với Redis. Khi người dùng Logout, đưa chuỗi `accessToken` đó vào danh sách đen (Blacklist) trong Redis với thời gian sống (TTL) bằng đúng thời gian còn lại của Token. Tại `AuthMiddleware`, kiểm tra xem token có nằm trong Blacklist hay không trước khi cho request đi tiếp.

### 3. Xoay vòng Refresh Token (Refresh Token Rotation - RTR)
- **Vấn đề hiện tại:** API `/refresh` chỉ cấp lại `accessToken` mới, còn `refreshToken` vẫn giữ nguyên suốt 7 ngày. Nếu hacker lấy cắp được `refreshToken`, chúng có thể sinh ra vô số `accessToken` để dùng.
- **Giải pháp đề xuất:** Áp dụng **RTR**. Mỗi lần user gọi API `/refresh`, thu hồi `refreshToken` cũ và **cấp lại một cặp mới tinh** (gồm cả Access + Refresh token mới). 
- *Nâng cao:* Nếu hệ thống phát hiện một `refreshToken` cũ (đã từng sử dụng) bị gọi lại lần thứ 2, đó là dấu hiệu chắc chắn token đã bị đánh cắp. Ngay lập tức xóa toàn bộ token của User đó trong hệ thống.

### 4. Bổ sung Rate Limiting (Chống Brute-force/Nhồi thông tin)
- **Vấn đề hiện tại:** Các endpoint như `/api/auth/login` và `/register` hiện đang mở, dễ bị bot tấn công dò mật khẩu liên tục (Brute-force) hoặc tạo hàng loạt tài khoản rác (Spam).
- **Giải pháp đề xuất:** Sử dụng công cụ Rate Limiting của Redis để bọc lại 2 API này.
  - Chỉ cho phép thử đăng nhập sai 5 lần/phút/IP.
  - Nếu vượt quá số lần, chặn IP trong thời gian nhất định hoặc tự động khóa tài khoản (chuyển `user.Status = "locked"`).

### 5. Dịch chuyển từ "Role-based" sang "Permission-based" (Tương lai xa)
- **Vấn đề hiện tại:** Đang sử dụng kiểm tra "cứng" Role (`student`, `teacher`, `admin`) qua `RoleMiddleware`. Khi hệ thống phình to, việc phân quyền sẽ rất rối.
- **Giải pháp đề xuất:** Thiết kế theo quyền hạn (Permission).
  - Thay vì kiểm tra Role, hãy kiểm tra quyền thực thi hành động (Ví dụ: `RequirePermission("CREATE_EXAM")`).
  - Mỗi Role sẽ được cấp một mảng các Permissions. Backend sẽ tra cứu xem Role hiện tại có Permission tương ứng hay không.

<br>

# Cải tiến luồng tạo đề thi

Dựa trên thiết kế kiến trúc và yêu cầu của hệ thống EdTech lớn, dưới đây là các đề xuất nâng cấp luồng tạo câu hỏi và đề thi:

### 1. Thay đổi cách lưu trữ Danh sách câu hỏi của Đề thi (Quan trọng nhất)
- **Vấn đề hiện tại:** Danh sách câu hỏi đang được lưu trực tiếp vào bảng `exams` dưới dạng mảng Text `QuestionIDs pq.StringArray`. Cấu trúc này phá vỡ ràng buộc khóa ngoại (Foreign Key) của CSDL quan hệ. Khi xóa một câu hỏi, đề thi sẽ không biết và vẫn giữ ID đó (gây lỗi khi làm bài). Không thể lưu thứ tự hoặc điểm tùy chỉnh cho câu hỏi.
- **Giải pháp đề xuất:** Áp dụng đúng thiết kế trong `ARCHITECTURE.md`. Tạo bảng trung gian (Junction Table) `exam_questions` với các cột: `ExamID`, `QuestionID`, `OrderIndex` (thứ tự), và `CustomPoint` (điểm riêng).

### 2. Bổ sung Validation (Xác thực) khi tạo đề
- **Vấn đề hiện tại:** API `CreateExam` không xác thực xem các UUID trong mảng `QuestionIDs` có tồn tại thật trong CSDL hay không.
- **Giải pháp đề xuất:** Đếm số lượng ID hợp lệ trong bảng `questions`. Nếu `count` không bằng với độ dài mảng `QuestionIDs` gửi lên, báo lỗi chặn ngay quá trình tạo đề.

### 3. Khắc phục lỗi "Race Condition" khi di chuyển Ảnh
- **Vấn đề hiện tại:** Hàm `processImageUrl` đang dùng `os.Rename(sourcePath, finalPath)` để di dời ảnh từ thư mục `/temp` sang thư mục chính. Nếu hai giáo viên vô tình lấy chung một ảnh (cùng tên) và lưu cùng lúc, người thứ hai sẽ bị lỗi file not found, làm sập toàn bộ giao dịch tạo đề.
- **Giải pháp đề xuất:** Đổi `os.Rename` thành thao tác `Copy File` (tạo bản sao), sau đó thiết lập một Cronjob (chạy ngầm mỗi đêm) để dọn dẹp sạch sẽ thư mục `/temp/`.

### 4. Bổ sung tính năng "Trộn đề" (Shuffling)
- **Vấn đề hiện tại:** Cấu trúc đề thi đang bị cố định. Tất cả học sinh sẽ thấy cùng một thứ tự câu hỏi và thứ tự đáp án A, B, C, D, rất dễ xảy ra gian lận.
- **Giải pháp đề xuất:** Thêm trường `ShuffleQuestions bool` và `ShuffleOptions bool` vào `models.Exam`. Khi học sinh lấy đề thi (GetExam), Backend sẽ kiểm tra cờ này và dùng thuật toán xáo trộn (Shuffle) để mỗi học sinh đều có một "Mã đề" xáo trộn khác biệt từ cùng một bộ câu hỏi gốc.

<br>

# Cải tiến luồng làm bài thi và chấm bài

Luồng chấm điểm sử dụng AI Gemini đang được thiết kế rất tốt với cơ chế xử lý bất đồng bộ (Background job). Tuy nhiên, để đảm bảo hệ thống chịu tải cao và không bị lỗi khi có hàng ngàn học sinh cùng nộp bài, dưới đây là các đề xuất cải tiến:

### 1. Tránh sập API Gemini bằng Worker Queue (Rate Limiting)
- **Vấn đề hiện tại:** Trong hàm `SubmitExam`, lệnh `go processExamGrading(examResult.ID)` tạo ra một tiến trình ngầm (Goroutine) không kiểm soát. Nếu 1.000 học sinh nộp bài cùng lúc, Server sẽ tạo 1.000 kết nối đồng thời gọi sang API của Gemini. Điều này sẽ khiến API của Google từ chối phục vụ với lỗi `429 Too Many Requests`.
- **Giải pháp đề xuất:** 
  - Thay vì dùng `go` trần (Raw Goroutine), hãy đẩy nhiệm vụ (Job) chấm điểm vào một **Message Queue** (như Asynq, RabbitMQ hoặc danh sách Redis List).
  - Khởi tạo một số lượng Worker cố định (ví dụ: 10 worker) liên tục kéo các Job từ Queue ra để chấm. Việc này đảm bảo hệ thống chỉ gọi API Gemini tối đa 10 lần cùng lúc, giữ hệ thống ổn định tuyệt đối dù có 10.000 học sinh nộp bài.

### 2. Sửa lỗi gán cứng (Hardcode) User ID
- **Vấn đề hiện tại:** Trong API `GetMyExamResults` (Lấy danh sách bài đã thi), code đang gán cứng ID người dùng: `userID := "00000000-0000-0000-0000-000000000000"`. Điều này khiến mọi học sinh đều nhìn thấy chung một danh sách kết quả.
- **Giải pháp đề xuất:** Kích hoạt toàn diện Auth Middleware trên route này và trích xuất UUID thực tế của học sinh thông qua `c.MustGet("userID")`.

### 3. Tối ưu hoá luồng Kháng cáo (Appeal Workflow)
- **Vấn đề hiện tại:** Khi học sinh gọi API `/appeal`, trạng thái được cập nhật thành `PENDING` nhưng chưa có hệ thống thông báo báo động cho giáo viên.
- **Giải pháp đề xuất:** Tích hợp logic sinh `Notification` cho Role `Teacher` hoặc `Admin` phụ trách lớp học đó ngay trong hàm `AppealExamResult`. Điều này giúp giáo viên nhận được thông báo chuông (Real-time qua WebSocket hoặc Polling) ngay lập tức khi học sinh gửi khiếu nại chấm điểm.

<br>

# Cải tiến luồng gia hạn tài khoản

Để đảm bảo luồng thanh toán qua Webhook của SePay đạt chuẩn **An toàn bảo mật tuyệt đối** (không bị hack) và **Hiệu năng cao, không lỗi vặt** (UX mượt mà, không mất tiền oan của khách), dưới đây là kiến trúc 3 lớp bảo vệ cần áp dụng:

### 1. Thay đổi Model để tăng tỷ lệ thành công (UX & Performance)
- **Vấn đề hiện tại:** Hệ thống yêu cầu học sinh chuyển khoản với cú pháp chứa nguyên chuỗi UUID dài 36 ký tự (VD: `T24H 123e4567-e89b-12d3-a456-426614174000`). Nhiều ngân hàng tại Việt Nam sẽ tự động cắt ngắn nội dung chuyển khoản xuống còn 20-30 ký tự. Hệ quả là Regex không tìm ra UUID, học sinh mất tiền nhưng không được cộng ngày.
- **Giải pháp đề xuất:** Thêm một trường `PaymentCode` (Mã thanh toán ngắn) vào bảng `Transaction`.
  - Sinh ngẫu nhiên mã 6 ký tự (VD: `8A4F1D`) khi tạo đơn hàng.
  - Khách hàng sẽ chuyển khoản với nội dung cực ngắn: `T24H 8A4F1D`.
  - Cột này được đánh `uniqueIndex`, giúp DB tra cứu siêu tốc độ O(1) khi nhận được Webhook.

### 2. Vá lỗ hổng bảo mật Webhook (Bảo vệ Database)
- **Vấn đề hiện tại:** API `/webhook/sepay` đang mở hoàn toàn công khai và không xác thực xem người gửi có đúng là máy chủ của SePay hay không. Hacker có thể giả mạo gói tin JSON để lừa hệ thống cộng ngày miễn phí.
- **Giải pháp đề xuất:** Bắt buộc phải xác thực **API Token**. Tại hàm `HandleSePayWebhook`, đọc `Header["Authorization"]` và so sánh với `SEPAY_SECRET_KEY` lưu trong biến môi trường (`.env`). Chặn đứng (`401 Unauthorized`) mọi request không có Secret Key hợp lệ.

### 3. Đảm bảo toàn vẹn dữ liệu (ACID) & Tính luỹ đẳng (Idempotency)
- **Vấn đề hiện tại:** Thao tác đổi trạng thái Transaction thành `completed` và thao tác cộng ngày cho User đang diễn ra ở 2 câu lệnh SQL riêng biệt. Nếu rớt mạng ở giữa, trạng thái đơn hàng đã đổi nhưng ngày chưa được cộng. Hơn nữa, nếu SePay vô tình gọi Webhook 2 lần cho 1 đơn hàng, hệ thống có nguy cơ cộng ngày 2 lần.
- **Giải pháp đề xuất:** 
  - Đưa cả 2 thao tác trên vào một **Database Transaction** (`tx := h.DB.Begin()`). Nếu bước cộng ngày lỗi, phải `Rollback()` bước đổi trạng thái.
  - **Khóa Pessimistic Locking:** Sử dụng mệnh đề `FOR UPDATE` khi truy vấn Transaction trong Webhook (`txDB.Set("gorm:query_option", "FOR UPDATE").First(...)`). Điều này giúp khóa dòng dữ liệu lại, nếu có 2 Webhook đến cùng một tíc tắc, cái thứ hai sẽ phải đợi cái thứ nhất xử lý xong (phát hiện `completed` và bỏ qua), chống tuyệt đối lỗi Race Condition.

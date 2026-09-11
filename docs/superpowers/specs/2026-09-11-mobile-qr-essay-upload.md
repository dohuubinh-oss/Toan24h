# Design Spec: Mobile QR Essay Upload for Handwritten Math

## Overview
Cho phép học sinh đang làm bài thi trên máy tính có thể dùng điện thoại quét mã QR để chụp ảnh bài làm tự luận viết tay, gửi thẳng vào ô nhập bài làm trên máy tính mà không cần rời tab thi (tránh vi phạm hệ thống chống gian lận).

## Architecture & Data Flow

```
+------------------------------------+        +-------------------------+
| Desktop Exam Page (Essay Question) |        | Mobile Phone (Student)  |
| 1. Bấm "Chụp bằng điện thoại"      |        | 3. Quét QR -> Mở web    |
| 2. Hiện QR Code kèm sessionId      |        |    /mobile-upload?sess= |
| 4. Polling GET /mobile-upload/:id  |        | 5. Chụp ảnh bài làm     |
| 7. Nhận text OCR -> Điền Editor   |        | 6. POST /mobile-upload/ |
+------------------------------------+        +-------------------------+
                  ^                                        |
                  |                Backend                 |
                  +--- [In-memory Session Store + OCR] <---+
```

### 1. Backend API
- **Endpoint 1**: `POST /api/v1/mobile-upload/:sessionId`
  - Nhận file ảnh từ điện thoại (`multipart/form-data`).
  - Gọi Gemini OCR `services.ExtractTextFromImageWithGemini` để trích xuất chữ viết tay và công thức toán (LaTeX).
  - Lưu kết quả vào in-memory sync store có mutex và TTL (10 phút).
- **Endpoint 2**: `GET /api/v1/mobile-upload/:sessionId`
  - Trả về `{ "status": "waiting" }` nếu chưa có bài nộp.
  - Trả về `{ "status": "completed", "text": "..." }` khi đã nhận dạng xong và xóa session khỏi memory.

### 2. Frontend
- **Desktop (`EssayQuestion.tsx`)**:
  - Thêm nút **"Quét QR chụp bằng điện thoại"** bên cạnh nút tải ảnh truyền thống.
  - Khi click: Sinh `sessionId` ngẫu nhiên và mở Modal hiển thị mã QR.
  - Bắt đầu polling `GET /api/v1/mobile-upload/:sessionId` mỗi 1.5 giây.
  - Khi nhận được kết quả OCR: Nối nội dung vào RichTextEditor, hiển thị toast thành công và tự đóng Modal.
- **Mobile Page (`/mobile-upload/page.tsx`)**:
  - Giao diện thân thiện cho điện thoại (camera button to, preview ảnh chụp).
  - Nút "Gửi bài làm" gọi `POST /api/v1/mobile-upload/:sessionId` với hiệu ứng loading.
  - Khi gửi xong: Hiển thị màn hình thông báo thành công "Đã chuyển lời giải sang máy tính!".

## Verification Plan
1. Mở trang thi có câu tự luận trên máy tính.
2. Bấm "Quét QR chụp bằng điện thoại".
3. Dùng điện thoại (hoặc tab giả lập mobile) mở link QR.
4. Chụp/tải ảnh một bài toán viết tay.
5. Kiểm tra trên máy tính xem nội dung có tự động cập nhật vào trình soạn thảo RichTextEditor hay không.

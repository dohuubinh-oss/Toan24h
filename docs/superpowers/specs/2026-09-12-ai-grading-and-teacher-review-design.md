# Tài Liệu Thiết Kế: Nâng Cấp Chấm Bài AI & Quy Trình Giáo Viên Chấm Bài Thủ Công

**Ngày:** 12-09-2026  
**Trạng thái:** Đã được duyệt  

---

## 1. Tổng Quan & Mục Tiêu

Tài liệu thiết kế này mô tả kiến trúc kỹ thuật, nâng cấp Prompt AI và trải nghiệm người dùng cho hệ thống Chấm thi AI & Chấm thi thủ công dành cho Giáo viên của Toan24h.

Các mục tiêu chính:
1. **Nâng cấp Prompt AI:** Chuẩn hóa Prompt 1 (Chấm tự luận gom nhóm) và Prompt 2 (Đánh giá tư duy trắc nghiệm gom nhóm) đảm bảo giữ nguyên 100% định dạng KaTeX/LaTeX, chống tràn token (nhận xét tối đa 2 câu), quy tắc thang điểm lẻ 0.25, chống ảo giác (bám sát `correctAnswer`), và truyền kèm các Metadata ID (`submissionId`, `examId`, `studentId`).
2. **Tab "Cần duyệt chấm" (Needs Review):** Thêm Tab thứ 3 trên trang `/dashboard/appeals` để liệt kê các bài thi có `status === "needs_review"`.
3. **Chế độ Chấm điểm Giáo viên trên Trang Kết Quả:** Tái sử dụng trực tiếp trang `/exam/[id]/result?mode=grade` để giáo viên xem bài thi giao diện giống học sinh, nhập điểm từng câu, viết nhận xét, nhập nhận xét tổng quan, và bấm "Lưu & Hoàn tất chấm điểm" để hoàn thành.

---

## 2. Kiến Trúc Hệ Thống & Thiết Kế Component

```
+-----------------------------------------------------------------------------------+
|                            Luồng Làm Việc Của Giáo Viên                           |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
                      +--------------------------------------+
                      |    Trang /dashboard/appeals          |
                      |  - Tab 1: Kháng cáo                  |
                      |  - Tab 2: Báo cáo lỗi                |
                      |  - Tab 3: Cần duyệt chấm             |
                      +------------------+-------------------+
                                         | Bấm "Chấm ngay"
                                         v
                      +--------------------------------------+
                      |  /exam/[id]/result?mode=grade        |
                      |  - Banner: Chế độ chấm của Giáo viên |
                      |  - Nhập điểm & Nhận xét từng câu     |
                      |  - Nhập Nhận xét tổng quan bài thi   |
                      |  - Nút: "Lưu & Hoàn tất chấm điểm"   |
                      +------------------+-------------------+
                                         | POST /api/v1/submissions/:id/grade-review
                                         v
                      +--------------------------------------+
                      |  Backend Cập Nhật DB & Thông Báo     |
                      |  - Trạng thái đổi thành 'graded'     |
                      |  - Gửi thông báo Chuông & Telegram   |
                      +--------------------------------------+
```

---

## 3. Các Thay Đổi Backend (Go Backend)

### A. Model `backend/internal/models/submission.go`
- Khai báo hằng số `StatusNeedsReview SubmissionStatus = "needs_review"`.
- Đảm bảo `Submission` có các trường `OverallEssayFeedback` và `OverallComprehensionFeedback`.
- Đảm bảo `QuestionAnswer` có các trường `DeductionReason`, `ComprehensionLevel`, `IsRandomGuess`.

### B. Service `backend/internal/services/ai_grader.go`
- Cập nhật Prompt 1 (`GradeEssayBatchWithGemini`) hỗ trợ LaTeX, chống tràn token, chống ảo giác và Metadata IDs.
- Cập nhật Prompt 2 (`EvaluateReasoningBatchWithGemini`) hỗ trợ đánh giá tư duy, `isRandomGuess`, `comprehensionLevel`, chống tràn token và Metadata IDs.

### C. Handlers & Routes (`backend/internal/handlers/exam_result_handler.go`, `routes.go`)
- **`GET /api/v1/submissions/needs-review`**: Trả về mảng bài thi có `status = 'needs_review'` kèm thông tin học sinh và đề thi.
- **`POST /api/v1/submissions/:id/grade-review`**: Tiếp nhận payload chứa `answersMap` đã cập nhật điểm, `totalScore`, `overallEssayFeedback`, `overallComprehensionFeedback`, cập nhật DB, đổi `status = 'graded'`, và tạo thông báo cho học sinh.

---

## 4. Các Thay Đổi Frontend (Next.js)

### A. API Service `frontend/src/lib/api.ts`
- `getNeedsReviewSubmissions()`: Gọi `GET /api/v1/submissions/needs-review`.
- `submitTeacherGradingReview(submissionId, payload)`: Gọi `POST /api/v1/submissions/:id/grade-review`.

### B. Trang Kháng Cáo `frontend/src/app/(main)/dashboard/appeals/page.tsx`
- Bổ sung Tab 3: **Cần duyệt chấm** (`reviews`).
- Hiển thị bảng liệt kê các bài thi cần chấm kèm tên học sinh, tên bài thi, ngày nộp, và nút liên kết tới `/exam/[submissionId]/result?mode=grade`.

### C. Trang Kết Quả `frontend/src/app/(fullscreen)/exam/[id]/result/page.tsx`
- Nhận biết tham số URL `mode === 'grade'`.
- Hiển thị Banner Giáo viên trên cùng.
- Hiển thị ô nhập điểm (bước 0.25, tối đa `maxScore`) và ô nhập lời nhắn cho từng câu hỏi.
- Hiển thị khung nhập nhận xét tổng quan bài thi.
- Hiển thị nút "Lưu & Hoàn tất chấm điểm" ở footer, gửi payload về API và chuyển hướng về `/dashboard/appeals`.

---

## 5. Tự Kiểm Tra Specs

- **Kiểm tra Placeholder:** Không có phần TODO hay TBD mơ hồ.
- **Tính đồng nhất:** Payload API backend khớp chính xác với gọi API frontend và data model.
- **Phạm vi tác động:** Các module được thiết kế độc lập, không ảnh hưởng đến tính năng làm bài thi của học sinh.

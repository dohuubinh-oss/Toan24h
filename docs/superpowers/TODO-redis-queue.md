# Kế hoạch tích hợp Hàng đợi (Queue) chấm điểm

## Hiện tại (Goroutine)
Hệ thống Toan24h đang sử dụng goroutine (`go processExamGrading(resultID)`) để xử lý việc chấm điểm ngầm. 
Đây là giải pháp tạm thời, nhẹ và không cần thiết lập hạ tầng phức tạp, nhưng có rủi ro mất dữ liệu nếu backend khởi động lại hoặc crash giữa chừng.

## Kế hoạch tương lai
Khi hệ thống có quy mô lớn hơn hoặc yêu cầu độ tin cậy tuyệt đối cho dữ liệu thi cử, chúng ta cần:
1. **Triển khai Redis + Asynq (hoặc RabbitMQ):** Đẩy ID của bài thi (ExamResult ID) vào hàng đợi.
2. **Worker xử lý độc lập:** Một (hoặc nhiều) worker server sẽ lấy task từ hàng đợi để gọi AI chấm điểm (tránh block server API chính).
3. **Cơ chế Retry (thử lại):** Nếu API Gemini bị lỗi hoặc timeout, task sẽ được đẩy lại vào hàng đợi để thử lại sau vài giây thay vì thất bại vĩnh viễn và bị bỏ qua.
4. **DLQ (Dead Letter Queue):** Các task lỗi quá 5 lần sẽ được đưa vào DLQ để admin có thể review hoặc chạy lại thủ công.

*Ghi chú này được tạo ra từ yêu cầu lưu ý trong quy trình thiết lập Grading Queue.*

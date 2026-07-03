# Các tính năng cần nâng cấp trong tương lai

## 1. Theo dõi tiến độ học tập của học sinh
- **Mô tả**: Hiện tại trang chi tiết bài giảng và danh sách bài giảng đang để thông số tĩnh (Mock) cho `practiceCount` (số bài luyện tập) và `status` (trạng thái: `not_started`, `in_progress`, `completed`).
- **Nâng cấp**: Cần tạo thêm bảng Database (ví dụ: `user_lecture_progress`) để lưu trữ trạng thái học của từng học sinh đối với từng bài giảng. Trả về thông số thật từ API để cập nhật UI.

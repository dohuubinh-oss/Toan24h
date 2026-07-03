# Sitemap (Sơ đồ các trang)

Dưới đây là sơ đồ chi tiết các trang đã được xây dựng trong frontend của dự án Toan24h:

## 1. Các trang Public (Bên ngoài)
- 🏠 `/` - Trang chủ
- 🔑 `/login` - Đăng nhập
- 📝 `/register` - Đăng ký
- ❓ `/forgot-password` - Quên mật khẩu
- 🧪 `/ui-lab` - Trang test UI components

## 2. Khu vực Giáo viên / Admin (Bảng điều khiển & Quản lý)
- 👥 `/dashboard/users` - Quản lý người dùng
- 📋 `/dashboard/exams` - Quản lý đề thi
- ❓ `/dashboard/questions` - Quản lý câu hỏi
- ➕ `/dashboard/exams/create` - Tạo đề thi mới (Toàn màn hình)
- ➕ `/dashboard/questions/create` - Tạo câu hỏi mới (Toàn màn hình)
- 📚 `/lectures/create` - Trang tạo bài giảng mới (Toàn màn hình)

## 3. Khu vực Học sinh (Trang học tập)
- 🎓 `/student` - Bảng điều khiển (Dashboard) tổng quan của học sinh
- 📝 `/practices` - Trang bài tập tổng hợp
- 📝 `/practices/lop/[grade]` - Danh sách bài tập theo từng khối lớp
- 📖 `/lectures` - Trang danh sách bài giảng tổng hợp
- 📖 `/lectures/lop/[grade]` - Danh sách bài giảng theo khối lớp (Đang dùng Mock Data)
- 📖 `/lectures/[id]` - Chi tiết bài giảng chung
- 📖 `/lectures/lop/[grade]/[id]` - Chi tiết bài giảng theo khối lớp (Đang dùng Mock Data)

## 4. Khu vực Làm bài thi
- ✍️ `/exam/[id]/take` - Màn hình làm bài thi
- 📊 `/exam/[id]/result` - Màn hình xem kết quả thi

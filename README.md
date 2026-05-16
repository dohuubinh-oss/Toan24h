# 🚀 The Golden Template: Agency-Grade Web Stack

Đây là bản mẫu dự án (Golden Template) được thiết kế cho các ứng dụng web chuyên nghiệp, yêu cầu **Thẩm mỹ cao**, **Quy trình kỷ luật** và **Khả năng chịu tải (High-Concurrency)**.

## 🏗️ Tech Stack
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + Framer Motion.
- **Backend**: Golang (Gin/Fiber) - Tối ưu cho 1,000+ users đồng thời.
- **Cache**: Redis (Session & Data Caching).
- **Database**: PostgreSQL (Relational Data).
- **Proxy/LB**: Nginx (Reverse Proxy, SSL, Gzip).
- **Infrastructure**: Docker & Docker Compose.

## 💎 Quy tắc Thiết kế (Editorial Scholarship)
Dự án tuân thủ triết lý thiết kế **Editorial Scholarship**:
- Tập trung vào Typography và Whitespace.
- Hệ thống màu sắc và font được định nghĩa tập trung trong `DESIGN.md`.
- Kiến trúc "No-Line" (Sử dụng shadow và background thay cho border).

## 🛡️ Quy trình Phát triển (Superpowers)
Mọi thay đổi trong dự án này phải tuân thủ **Iron Laws**:
1. **Brainstorming First**: Luôn thảo luận giải pháp trước khi code.
2. **Strict TDD**: Viết test trước khi viết logic.
3. **Agency Agents**: Sử dụng các chuyên gia AI trong `.agent/skills/` để hỗ trợ từng lĩnh vực.

## 🚀 Hướng dẫn khởi động nhanh
1. **Copy** toàn bộ thư mục này sang dự án mới.
2. **Chạy hệ thống**:
   ```bash
   make build
   make up
   ```
3. **Truy cập**:
   - Frontend: `http://localhost`
   - Health Check API: `http://localhost/api/health`

## 🛠️ Các lệnh Makefile quan trọng
- `make help`: Xem tất cả các lệnh hỗ trợ.
- `make logs`: Xem log từ các dịch vụ.
- `make test-backend`: Chạy unit test backend.
- `make clean`: Dọn dẹp môi trường.

---
*Developed with ❤️ by Antigravity & Superpowers Framework.*

## 💡 Lưu ý quan trọng (Pro-tips)
Để dự án mẫu phát huy tối đa sức mạnh, hãy ghi nhớ:

1. **Quản lý Secrets**: Luôn sử dụng file `.env` cho các thông tin nhạy cảm (DB password, API keys). Không hardcode trong `docker-compose.yml`.
2. **Database Migrations**: Sử dụng GORM Migrations hoặc Golang-migrate để quản lý thay đổi cấu trúc DB thông qua code.
3. **Agency Agents**: Tận dụng các chuyên gia AI trong `.agent/skills/`. Bạn có thể tùy chỉnh các file `SKILL.md` này để "huấn luyện" AI theo phong cách riêng của bạn.
4. **Performance**: Tận dụng Redis để caching các query nặng và Nginx để nén dữ liệu (Gzip).
5. **Isolation**: Cập nhật tên dự án trong `GEMINI.md` khi copy sang dự án mới để AI không bị nhầm lẫn context.
6. **Continuous Improvement**: Hãy coi bản mẫu này là một thực thể sống. Cập nhật các kỹ thuật mới vào đây để các dự án sau luôn được thừa hưởng những gì tốt nhất.

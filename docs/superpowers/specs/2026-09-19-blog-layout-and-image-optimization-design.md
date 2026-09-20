# Thiết Kế Chi Tiết: Tối Ưu Tốc Độ Tải Trang, Hình Ảnh & Layout 2 Cột Blog

- **Ngày tạo**: 2026-09-19
- **Trạng thái**: Đã phê duyệt (Approved)
- **Mục tiêu**: Nâng cấp layout trang Blog ([`/blog`](file:///Users/modeptrai/Desktop/toan6789.vn/frontend/src/app/\(main\)/blog/page.tsx)) theo mô hình 2 cột (Main bên trái 3 card/hàng, Sidebar bên phải) và triển khai chiến lược tối ưu hoá hình ảnh & tốc độ tải trang toàn diện trên toàn codebase.

---

## 1. Kiến Trúc & Thiết Kế Giao Diện (UI/UX) Trang Blog

### 1.1. Cấu Trúc Layout 2 Cột
- **Container**: `max-w-[1400px]` căn giữa, đệm lề linh hoạt `px-4 sm:px-6 lg:px-8`.
- **Cột Trái (Danh Sách Bài Viết - Main Content)**:
  - Chiếm tỷ lệ lớn: `lg:col-span-8 xl:col-span-9`.
  - Hiển thị theo dạng lưới (Grid):
    - Màn hình lớn (`xl` trở lên): **3 card / 1 hàng** (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6`).
    - Màn hình vừa (`md` đến `lg`): 2 card / 1 hàng.
    - Màn hình di động: 1 card / 1 hàng.
  - Phân trang: Đặt `ITEMS_PER_PAGE = 9` (tương ứng 3 hàng x 3 cột đầy đủ trên màn hình desktop).
- **Cột Phải (Sidebar)**:
  - Chiếm tỷ lệ phụ trợ: `lg:col-span-4 xl:col-span-3`.
  - Cố định khi cuộn trang: `lg:sticky lg:top-24 space-y-6`.
  - Chứa 2 khối thành phần theo thứ tự trên xuống:
    1. **Đăng Ký Nhận Tin (Newsletter)**: Nền gradient xanh chàm, form nhập email đăng ký.
    2. **Chuyên Mục Nổi Bật (Categories)**: Liệt kê các danh mục kèm số lượng bài viết, chọn để lọc nhanh.

### 1.2. Thẻ Bài Viết (Blog Card)
- Khung ảnh bìa: Tỷ lệ `aspect-[16/10]` hoặc `h-44`, sử dụng `next/image` với `sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"` và `loading="lazy"`.
- Tiêu đề: Giới hạn tối đa 2 dòng `line-clamp-2` với hiệu ứng đổi màu khi hover.
- Footer: Avatar tác giả thực tế + Tên tác giả + Nút "Đọc tiếp".

---

## 2. Chiến Lược Tối Ưu Tốc Độ Tải Trang & Hình Ảnh (Toàn Codebase)

### 2.1. Cấu hình Next.js Image Optimization ([`frontend/next.config.mjs`](file:///Users/modeptrai/Desktop/toan6789.vn/frontend/next.config.mjs))
- Bật tối ưu định dạng ảnh hiện đại:
  ```javascript
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000, // 30 ngày cache
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'api.toan6789.vn' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  }
  ```

### 2.2. Chuyển Đổi Thẻ `<img>` sang `next/image` Phía Frontend
- **Bài viết nổi bật / Hero banner (LCP)**: Đặt `priority={true}` để trình duyệt ưu tiên nạp đầu tiên, loại bỏ độ trễ hiển thị LCP.
- **Danh sách card & Avatars**: Dùng `next/image` với `loading="lazy"`, responsive `sizes`, tự động chọn file `.webp` hoặc `.avif` nhẹ hơn 60-80% so với JPG/PNG gốc.
- **Tránh Layout Shift (CLS)**: Thiết lập kích thước `width`/`height` hoặc bọc trong container `relative aspect-*` với thuộc tính `fill` và `object-cover`.

### 2.3. Tối Ưu Cache Header Phía Backend Go ([`backend/cmd/server/main.go`](file:///Users/modeptrai/Desktop/toan6789.vn/backend/cmd/server/main.go))
- Thiết lập middleware Cache-Control cho đường dẫn `/uploads`:
  ```go
  r.StaticFS("/uploads", &customCacheFileSystem{http.Dir(uploadDir)})
  // Header: Cache-Control: public, max-age=31536000, immutable
  ```
- Trình duyệt chỉ tải ảnh tải lên một lần duy nhất và tái sử dụng từ local disk cache.

---

## 3. Kế Hoạch Kiểm Thử & Đo Lường

1. **Kiểm Tra Giao Diện**:
   - Màn hình >= 1280px: Hiển thị 3 card bài viết trên 1 hàng, Sidebar bên phải.
   - Phân trang hiển thị 9 bài/trang khi số lượng bài viết >= 10.
   - Newsletter và lọc danh mục hoạt động trơn tru.
2. **Kiểm Tra Hiệu Năng & Ảnh**:
   - Chạy kiểm tra Network tab trên DevTools: Ảnh được Next.js tự động chuyển đổi sang định dạng `image/webp` hoặc `image/avif` với dung lượng nhỏ (vài chục KB thay vì vài MB).
   - Kiểm tra header `Cache-Control` của các file upload đạt chuẩn `max-age=31536000`.
   - Chạy `npx tsc --noEmit` và `go test ./...` đảm bảo không phát sinh lỗi types hay compile.

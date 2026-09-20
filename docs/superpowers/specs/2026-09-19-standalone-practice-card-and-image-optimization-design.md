# Design Spec: Standalone Practice/Exam Cards & App Speed Optimization

**Date:** 2026-09-19  
**Status:** Draft / Approved by User  
**Scope:** Frontend (`/dashboard/lectures/create`, `/lectures/lop/[grade]`, `LectureCard.tsx`, `PracticeLectureCard.tsx`, `lectureApi.ts`) & Backend Data Handling  

---

## 1. Mục tiêu (Goals & Problem Statement)

1. **Card Luyện tập & Đề kiểm tra tạo riêng (Standalone Practice Cards)**:
   - Cho phép giáo viên/admin tạo các Card Ôn tập sau bài học, Ôn tập chương, Đề kiểm tra 15p, 45p, thi giữa/cuối kỳ ngay từ trang tạo bài giảng `/dashboard/lectures/create`.
   - Giữ nguyên bố cục trang tạo bài giảng; khi chọn chế độ "Card Luyện tập & Đề kiểm tra", các khu vực soạn thảo Lý thuyết & Dạng toán mẫu sẽ được **disable** (không cho nhập) thay vì ẩn đi.
   - Khi bấm vào Card Luyện tập trên danh sách bài học, học sinh được chuyển hướng trực tiếp đến trang danh sách đề thi liên kết: `/practices/lop/[grade]?lecture=[id]&lectureName=[title]&practiceIds=[practiceIds]`.
2. **Loại bỏ Mock Data & Tự động hiển thị theo thứ tự**:
   - Gỡ bỏ hoàn toàn logic hardcode chèn thẻ bài luyện tập mẫu trong `/lectures/lop/[grade]`.
   - Danh sách bài giảng & bài luyện tập được backend sắp xếp tự nhiên theo `updated_at`.
3. **Tối ưu tốc độ tải trang & hình ảnh (Performance & Image Optimization)**:
   - Nâng cấp thẻ `<img>` sang Next.js `next/image` (`<Image />`) với responsive sizing, lazy loading và WebP format.
   - Loại bỏ query thừa (`getExams` / `getMyExamResults` lặp ở cấp độ trang) để tăng tốc First Contentful Paint (FCP) và Largest Contentful Paint (LCP).

---

## 2. Kiến trúc & Thiết kế chi tiết (Detailed Design)

### 2.1. Giao diện Tạo / Sửa (`/dashboard/lectures/create`)

- **Switch Chế độ Nội dung**:
  - Giao diện có 2 tùy chọn chế độ:
    1. `📘 Bài giảng lý thuyết` (Mặc định): Soạn thảo đầy đủ Lý thuyết, Dạng toán mẫu, và gắn Đề thi liên kết.
    2. `📝 Card Luyện tập & Đề kiểm tra`: Dành riêng cho ôn tập, kiểm tra 15p, 45p, thi học kỳ.
- **Trạng thái Disabled trên Layout**:
  - Khi ở chế độ `📝 Card Luyện tập & Đề kiểm tra`:
    - Layout vẫn giữ nguyên để trải nghiệm người dùng nhất quán.
    - Editor Lý thuyết (`basicConcept`) và danh sách Dạng toán (`dangToanList`) chuyển sang trạng thái **disabled** (mờ đi nhẹ với lớp phủ hoặc `pointer-events-none`, có ghi chú: *"Phần này không khả dụng cho Card Luyện tập & Đề kiểm tra"*).
    - Validation bỏ qua yêu cầu bắt buộc phải có nội dung lý thuyết & dạng toán mẫu; chỉ yêu cầu có **Tiêu đề**, **Khối lớp**, **Chương/Chủ đề**, và **Danh sách đề thi liên kết (`practiceIds`)**.
- **Payload gửi lên Backend**:
  - `title`: string
  - `grade`: string
  - `category`: string
  - `basicConcept`: `""` (khi là Card Luyện tập)
  - `examples`: `[]` (khi là Card Luyện tập)
  - `practiceIds`: string (JSON array chứa ID các đề thi đã chọn)

---

### 2.2. Hiển thị trên Danh sách Bài giảng (`/lectures/lop/[grade]`)

- **Phân loại hiển thị tự động**:
  - Khi duyệt qua danh sách trả về từ backend:
    - Nếu item có nội dung lý thuyết hoặc bài tập mẫu (`item.basicConcept?.trim() || (item.examples && item.examples !== '[]')`): Render `<LectureCard />` -> Click mở `/lectures/lop/[grade]/[id]`.
    - Nếu item là Card Luyện tập (không có lý thuyết & dạng toán, có `practiceIds`): Render `<PracticeLectureCard />` -> Click mở `/practices/lop/[grade]?lecture=${item.id}&lectureName=${encodeURIComponent(item.title)}&practiceIds=${encodeURIComponent(item.practiceIds)}`.
- **Gỡ bỏ Mock Hardcoded**:
  - Xóa bỏ `idx === 2` chèn "Bài ôn chương 1" hoặc tự sinh `PracticeLectureCard` giả lập.

---

### 2.3. Tối ưu hình ảnh & Tốc độ App

- **Next.js `<Image />`**:
  - Cập nhật `LectureCard.tsx`:
    ```tsx
    import Image from 'next/image';
    
    // Trong thẻ chứa thumbnail:
    <div className="relative h-44 overflow-hidden">
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : ( ... )}
    </div>
    ```
- **Tối ưu truy vấn dữ liệu**:
  - Sử dụng số lượng đề trực tiếp từ độ dài mảng `practiceIds` có sẵn trong mỗi bài giảng / card luyện tập thay vì gọi `getExams()` toàn bộ hệ thống ở server component.

---

## 3. Kế hoạch kiểm thử & Đảm bảo chất lượng (Verification Plan)

1. **Kiểm thử giao diện Tạo**:
   - Vào `/dashboard/lectures/create`, chuyển sang `📝 Card Luyện tập & Đề kiểm tra`.
   - Kiểm tra: Editor Lý thuyết & Dạng toán bị disable, không cho gõ.
   - Nhập tiêu đề, chọn khối lớp, chọn các đề thi liên kết -> Bấm Tạo -> Tạo thành công.
2. **Kiểm thử hiển thị danh sách**:
   - Vào `/lectures/lop/8`: Thấy cả Card bài giảng và Card luyện tập hiển thị đúng theo thứ tự thời gian.
   - Click Card luyện tập -> Chuyển sang `/practices/lop/8` và chỉ hiển thị đúng các bài tập được liên kết.
3. **Kiểm thử tốc độ & hình ảnh**:
   - Kiểm tra Next.js render hình ảnh qua `<Image />` mà không lỗi domain cấu hình.
   - Chạy `npx tsc --noEmit` và `go test ./...` đảm bảo không lỗi kiểu dữ liệu.

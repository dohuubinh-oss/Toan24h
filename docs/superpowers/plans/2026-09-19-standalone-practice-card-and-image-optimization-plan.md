# Standalone Practice/Exam Cards & App Speed Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép tạo Card Luyện tập / Đề kiểm tra riêng biệt trực tiếp từ `/dashboard/lectures/create` (với chế độ disabled cho phần soạn thảo lý thuyết), hiển thị tự động trên danh sách `/lectures/lop/[grade]` theo thứ tự thời gian, và tối ưu hóa hình ảnh với Next.js `<Image />` cùng truy vấn dữ liệu nhanh.

**Architecture:** Mở rộng `LectureCreatorContext` với `contentType` (`'lecture' | 'practice'`). Khi là `'practice'`, các editor lý thuyết/dạng toán chuyển sang trạng thái disabled, backend lưu `practiceIds` và rỗng `basicConcept`/`examples`. Frontend `/lectures/lop/[grade]` phân loại render `<LectureCard>` hoặc `<PracticeLectureCard>` dẫn trực tiếp đến `/practices/lop/[grade]?lecture=...`. Nâng cấp `LectureCard` sang `next/image` với responsive lazy-loading.

**Tech Stack:** Next.js 16 (Turbopack, App Router, `next/image`), TypeScript, React, Tailwind CSS, Go (Backend API).

---

## Global Constraints

- Không thay đổi cấu trúc bảng cơ sở dữ liệu nếu không cần thiết (tận dụng trường `basicConcept`, `examples`, `practiceIds` của `lectures`).
- Giữ nguyên toàn bộ layout `/dashboard/lectures/create`, chỉ áp dụng lớp phủ / disabled trạng thái khi chọn Card Luyện tập.
- Đảm bảo 100% type-safety với `npx tsc --noEmit` và các bài test Go `go test ./...`.

---

### Task 1: Mở rộng `LectureCreatorContext` hỗ trợ `contentType` (`lecture` / `practice`)

**Files:**
- Modify: `frontend/src/components/lecture/creator/LectureCreatorContext.tsx`

**Interfaces:**
- Produces: `contentType: 'lecture' | 'practice'`, `setContentType: (type: 'lecture' | 'practice') => void`.

- [ ] **Step 1: Cập nhật `LectureCreatorState` và `LectureCreatorProvider`**

Thêm `contentType` vào state và context. Trong `validateAndSubmit`, nếu `contentType === 'practice'`:
- Bỏ qua kiểm tra `basicConcept` và `dangToanList`.
- Bắt buộc kiểm tra `title` và danh sách đề liên kết (nếu có thể chọn đề).
- Gửi payload `basicConcept: ""` và `examples: []`.

- [ ] **Step 2: Kiểm tra type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit Task 1**

```bash
git add frontend/src/components/lecture/creator/LectureCreatorContext.tsx
git commit -m "feat(lecture-creator): add contentType state and practice card validation bypass"
```

---

### Task 2: Thêm Switch Chế độ và Disabled UI trong Giao diện Tạo Bài Giảng

**Files:**
- Modify: `frontend/src/components/lecture/creator/LectureBasicSettings.tsx`
- Modify: `frontend/src/app/(fullscreen)/dashboard/lectures/create/page.tsx`

- [ ] **Step 1: Thêm Segmented Control chuyển đổi `contentType` trong `LectureBasicSettings.tsx`**

Thêm 2 nút gạt lựa chọn ở đầu thẻ cài đặt:
1. `📘 Bài giảng lý thuyết`
2. `📝 Card Luyện tập & Đề kiểm tra`

Khi đang ở chế độ `practice`: hiển thị badge thông báo và gợi ý chọn các Đề thi liên kết.

- [ ] **Step 2: Áp dụng lớp phủ disabled cho phần Lý thuyết và Dạng toán trong `create/page.tsx`**

Khi `contentType === 'practice'`:
- Áp dụng lớp `opacity-40 pointer-events-none select-none relative` cho khu vực `LectureConceptEditor` và danh sách `DangToanCard`.
- Hiển thị thông báo nhỏ: *"Khu vực này bị vô hiệu hóa cho chế độ Card Luyện tập & Đề kiểm tra"*.

- [ ] **Step 3: Kiểm tra type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit Task 2**

```bash
git add frontend/src/components/lecture/creator/LectureBasicSettings.tsx frontend/src/app/\(fullscreen\)/dashboard/lectures/create/page.tsx
git commit -m "feat(lecture-creator): add contentType switch and disabled state overlay for practice cards"
```

---

### Task 3: Tối ưu `LectureCard.tsx` với Next.js `<Image />` và cập nhật `PracticeLectureCard`

**Files:**
- Modify: `frontend/src/components/lectures/LectureCard.tsx`

- [ ] **Step 1: Chuyển thẻ `<img>` sang Next.js `next/image` (`<Image />`) trong `LectureCard`**

Sử dụng `<Image />` với `fill`, `sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"`, `loading="lazy"`, `unoptimized` nếu URL bên ngoài chưa cấu hình domain.

- [ ] **Step 2: Đảm bảo `PracticeLectureCard` nhận `href`, `title`, `grade`, `practiceCount`**

Hỗ trợ link tùy chỉnh đến trang `/practices/lop/[grade]?lecture=...` chứa đầy đủ bộ lọc đề thi liên kết.

- [ ] **Step 3: Kiểm tra type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit Task 3**

```bash
git add frontend/src/components/lectures/LectureCard.tsx
git commit -m "perf(lectures): optimize LectureCard with next/image and update PracticeLectureCard"
```

---

### Task 4: Cập nhật Danh sách `/lectures/lop/[grade]` - Tự động hiển thị và Loại bỏ Mock Data

**Files:**
- Modify: `frontend/src/app/(main)/(dashboardStudent)/lectures/lop/[grade]/page.tsx`

- [ ] **Step 1: Gỡ bỏ Mock Hardcode `PracticeLectureCard`**

Xóa logic hardcode `idx === 2` chèn "Bài ôn chương 1" hoặc tự sinh `PracticeLectureCard` giả lập.

- [ ] **Step 2: Phân loại render `<LectureCard>` hoặc `<PracticeLectureCard>` dựa trên dữ liệu thật**

Duyệt danh sách `lectures`:
- Nếu `(!lecture.basicConcept || lecture.basicConcept.trim() === '') && (!lecture.examples || lecture.examples === '[]')`:
  - Là Card Luyện tập -> Render `<PracticeLectureCard />` với `href={/practices/lop/${grade}?lecture=${lecture.id}&lectureName=${encodeURIComponent(lecture.title)}${lecture.practiceIds ? `&practiceIds=${encodeURIComponent(lecture.practiceIds)}` : ''}}` và `practiceCount`.
- Ngược lại:
  - Là Bài giảng lý thuyết -> Render `<LectureCard />`.

- [ ] **Step 3: Tối ưu dữ liệu & đếm số đề**

Tận dụng `lecture.practiceIds` (parse độ dài mảng) để hiển thị số lượng đề ngay lập tức, giảm thiểu việc phụ thuộc vào fetch toàn bộ `getExams()`.

- [ ] **Step 4: Kiểm tra type check và build**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit Task 4**

```bash
git add frontend/src/app/\(main\)/\(dashboardStudent\)/lectures/lop/\[grade\]/page.tsx
git commit -m "feat(lectures): render standalone practice cards and remove mock hardcoded cards"
```

---

### Task 5: Kiểm thử Tổng thể & Hoàn thiện

**Files:**
- Verification only

- [ ] **Step 1: Chạy Typecheck Frontend & Backend Tests**

Run:
```bash
cd /Users/modeptrai/Desktop/toan6789.vn/frontend && npx tsc --noEmit
cd /Users/modeptrai/Desktop/toan6789.vn/backend && go test ./...
```
Expected: All pass with 0 errors.

- [ ] **Step 2: Tạo Walkthrough tổng kết**

Tạo tài liệu `walkthrough.md` chi tiết và hướng dẫn sử dụng.

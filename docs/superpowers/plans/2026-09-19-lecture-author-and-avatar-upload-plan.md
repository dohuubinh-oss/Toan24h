# Lecture Author Association & Avatar Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Liên kết bài giảng với tài khoản tác giả thật (thay thế mock data "Thầy Nguyễn Văn A", bài giảng cũ hiển thị "Nhóm Toan6789") và bổ sung tính năng tải lên ảnh đại diện cá nhân (Avatar Upload) tại trang `/profile`.

**Architecture:** Mở rộng `Lecture` model trong backend với `AuthorID` (khóa ngoại liên kết `User`) và preload `Author` khi trả về dữ liệu bài giảng. Thêm endpoint `POST /api/v1/users/me/avatar` xử lý upload ảnh vào `./uploads/avatars/`. Cập nhật giao diện `ProfilePage` (thêm nút camera upload), `LectureBasicSettings` (admin chọn tác giả), và `LectureHeader` (hiển thị tác giả thực tế).

**Tech Stack:** Go 1.22+, GORM, Gin (Backend); Next.js 15, TypeScript, Tailwind CSS (Frontend).

## Global Constraints

- **Tác giả bài giảng cũ**: Hiển thị chính xác **"Nhóm Toan6789"**.
- **Tác giả bài giảng mới**: Hiển thị `Thầy/Cô [Họ và tên]` kèm avatar thật của tác giả.
- **Upload Avatar**: Hỗ trợ định dạng `.jpg`, `.jpeg`, `.png`, `.webp`, tối đa 5MB, lưu vào `./uploads/avatars/`.

---

### Task 1: Mở Rộng Lecture Model & Preload Author Trong Repository / Service

**Files:**
- Modify: `backend/internal/models/lecture.go`
- Modify: `backend/internal/repository/lecture_repository.go`
- Modify: `backend/internal/services/lecture_service.go`
- Test: `backend/internal/services/lecture_service_test.go`

- [ ] **Step 1: Cập nhật Lecture Model**

Cập nhật `backend/internal/models/lecture.go`:
```go
package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Lecture struct {
	ID           uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Title        string         `gorm:"type:varchar(255);not null" json:"title"`
	Grade        string         `gorm:"type:varchar(50);not null" json:"grade"`
	Category     string         `gorm:"type:varchar(100);not null" json:"category"`
	BasicConcept string         `gorm:"type:text" json:"basicConcept"`
	Examples     string         `gorm:"type:jsonb;default:'[]'" json:"examples"`
	AuthorID     *uuid.UUID     `gorm:"type:uuid;index" json:"authorId,omitempty"`
	Author       *User          `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}
```

- [ ] **Step 2: Cập nhật LectureRepository để Preload Author**

Cập nhật các hàm `FindByID`, `FindByGrade`, `FindAll` trong `backend/internal/repository/lecture_repository.go` để `.Preload("Author")`.

- [ ] **Step 3: Chạy test repository/service**

Run: `cd backend && go test ./internal/services -v`
Expected: PASS.

- [ ] **Step 4: Commit task 1**

```bash
git add backend/internal/models/lecture.go backend/internal/repository/lecture_repository.go backend/internal/services/lecture_service.go
git commit -m "feat(models): add Author relation to Lecture model and preload in repository"
```

---

### Task 2: Xây Dựng Endpoint Tải Lên Avatar (`POST /api/v1/users/me/avatar`)

**Files:**
- Modify: `backend/internal/handlers/user_handler.go`
- Modify: `backend/internal/routes/routes.go`
- Create: `backend/internal/handlers/avatar_upload_test.go`

- [ ] **Step 1: Viết test cho upload avatar endpoint**

Tạo `backend/internal/handlers/avatar_upload_test.go`.

- [ ] **Step 2: Triển khai hàm `UploadAvatar` trong `user_handler.go`**

Xử lý nhận file, validate dung lượng $\le 5$MB và định dạng ảnh, lưu vào `./uploads/avatars/`, cập nhật `user.TelegramAvt` (hoặc avatar url) và lưu vào database.

- [ ] **Step 3: Đăng ký route `protected.POST("/users/me/avatar", userHandler.UploadAvatar)` trong `routes.go`**

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `cd backend && go test ./internal/handlers -run TestUploadAvatar -v`
Expected: PASS.

- [ ] **Step 5: Commit task 2**

```bash
git add backend/internal/handlers/user_handler.go backend/internal/routes/routes.go backend/internal/handlers/avatar_upload_test.go
git commit -m "feat(users): implement POST /api/v1/users/me/avatar endpoint"
```

---

### Task 3: Cập Nhật Lưu AuthorID Khi Tạo/Sửa Bài Giảng

**Files:**
- Modify: `backend/internal/controllers/lecture_controller.go`
- Modify: `backend/internal/services/lecture_service.go`

- [ ] **Step 1: Thêm `AuthorID *string` vào `CreateLectureRequest`**

- [ ] **Step 2: Trong `lecture_controller.go`, tự động gán `AuthorID` từ `c.Get("userID")` nếu người dùng không truyền lên**

- [ ] **Step 3: Lưu `AuthorID` vào record `models.Lecture` khi tạo và sửa**

- [ ] **Step 4: Commit task 3**

```bash
git add backend/internal/controllers/lecture_controller.go backend/internal/services/lecture_service.go
git commit -m "feat(lectures): bind author ID on lecture creation and update"
```

---

### Task 4: Tích Hợp Tải Lên Avatar Tại Giao Diện Profile (`/profile`)

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/app/(main)/profile/page.tsx`

- [ ] **Step 1: Thêm hàm `uploadUserAvatar` trong `frontend/src/lib/api.ts`**

```typescript
export async function uploadUserAvatar(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await apiFetch('/users/me/avatar', {
    method: 'POST',
    body: formData,
  })
  return res.data?.avatarUrl || res.avatarUrl
}
```

- [ ] **Step 2: Thêm nút Camera và input file vào Avatar component trong `ProfilePage`**

- [ ] **Step 3: Xử lý upload, hiển thị toast và cập nhật state + localStorage tức thì**

- [ ] **Step 4: Commit task 4**

```bash
git add frontend/src/lib/api.ts frontend/src/app/\(main\)/profile/page.tsx
git commit -m "feat(profile): integrate avatar image upload UI and API"
```

---

### Task 5: Cập Nhật LectureHeader Hiển Thị Tác Giả Thật & Chọn Tác Giả Trong Lecture Creator

**Files:**
- Modify: `frontend/src/components/lecture/LectureHeader.tsx`
- Modify: `frontend/src/components/lecture/creator/LectureBasicSettings.tsx`
- Modify: `frontend/src/components/lecture/creator/LectureCreatorContext.tsx`
- Modify: `frontend/src/app/(main)/lectures/lop/[grade]/[id]/page.tsx`

- [ ] **Step 1: Cập nhật `LectureHeader.tsx` nhận `author` props và hiển thị tên thật / "Nhóm Toan6789"**

- [ ] **Step 2: Cập nhật `LectureBasicSettings.tsx` để Admin có thể chọn tác giả biên soạn**

- [ ] **Step 3: Chạy type check frontend**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit task 5**

```bash
git add frontend/src/components/lecture/LectureHeader.tsx frontend/src/components/lecture/creator/LectureBasicSettings.tsx frontend/src/components/lecture/creator/LectureCreatorContext.tsx frontend/src/app/\(main\)/lectures/lop/\[grade\]/\[id\]/page.tsx
git commit -m "feat(lectures): display real author or fallback to Nhom Toan6789 in lecture header"
```

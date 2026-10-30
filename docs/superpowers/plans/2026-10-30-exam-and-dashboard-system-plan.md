# Kế Hoạch Triển Khai Hệ Thống Luyện Đề Thi (Exams) & Tối Ưu Bảng Xếp Hạng

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hoàn chỉnh phân hệ Luyện đề thi (`/exams` & `/exams/lop/[grade]`) với cơ chế phân loại đề thi theo chặng tiến độ GDPT 2018 (*Giữa kì 1, Cuối kì 1, Giữa kì 2, Cuối kì 2*), phân biệt chế độ làm bài Exam (có giám sát, đếm giờ) vs Practice (mở tài liệu, không phạt chuyển tab), và dọn dẹp liên kết Bảng xếp hạng (`/leaderboard`) tích hợp gọn gàng vào Dashboard.

**Architecture:** Sử dụng Next.js App Router (Server Components + Client Components tương tác). Dữ liệu đề thi và kết quả làm bài được fetch từ API Go hiện hữu (`/api/v1/exams`, `/api/v1/exam-results`). Tiến trình chặng học được tính toán đồng bộ qua module tiện ích `examMilestoneProgression.ts`. Giao diện tuân thủ tuyệt đối Google Material 3 Outlined tokens per `DESIGN.md`.

**Tech Stack:** Next.js 16 (App Router, Server Actions, Cookies), TypeScript, Tailwind CSS, Lucide Icons, Vitest, Testing Library, Go Fiber/Gin API.

**Spec:** [docs/superpowers/specs/2026-10-30-exam-and-dashboard-system-design.md](file:///Users/modeptrai/Desktop/toan6789.vn/docs/superpowers/specs/2026-10-30-exam-and-dashboard-system-design.md)

## Global Constraints

- **Font & Design:** Tuân thủ Material 3 Outlined, typography Lexend, cỡ chữ tối thiểu 12px, touch targets >= 44x44px.
- **Strict TDD:** Mọi tính năng và tiện ích phải có unit test viết trước hoặc song hành, 100% test pass.
- **Project Boundary:** Chỉ thao tác trong `/Users/modeptrai/Desktop/toan6789.vn`. Tuyệt đối không deploy lên VPS.
- **Simplicity:** KISS & YAGNI, không thêm abstraction thừa, tái sử dụng model và endpoint backend hiện có.

## Review Focus

1. **Học sinh chưa làm bài nào:** Hệ thống mặc định chọn chặng "Giữa kì 1" mà không bị crash hay hiển thị màn hình trống.
2. **Học sinh chuyển giữa các khối lớp:** Kiểm tra cookie `userGrade` cố định; không cho phép học sinh vào sai khối lớp mà tự động chuyển hướng đúng lớp của học sinh.
3. **Chế độ Luyện tập (Practice):** Học sinh mở tab mới tra cứu bài giảng trên `toan6789.vn` không bị kích hoạt đếm phạt `cheatCount` hay hủy bài thi.
4. **Chế độ Thi thử (Exam):** Học sinh cố tình rời phòng thi phải nhận được hộp thoại cảnh báo và xác nhận nộp bài.
5. **Đề thi chuyên đề / HSG:** Không bị biến mất khỏi giao diện khi học sinh chuyển chặng thi kì.

---

### Task 1: Dọn Dẹp Điều Hướng `/leaderboard` & Thiết Lập Redirect

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx`
- Modify: `frontend/src/components/layout/StudentBottomNav.tsx`
- Create: `frontend/src/app/(main)/(dashboardStudent)/leaderboard/page.tsx`
- Test: `frontend/src/components/layout/StudentBottomNav.test.tsx`
- Test: `frontend/src/components/layout/Sidebar.test.tsx`

**Interfaces:**
- Bottom nav items: chỉ còn `Dashboard` (`/student`), `Bài giảng` (`/lectures`), `Đề thi` (`/exams`).
- Route `/leaderboard`: server redirect 307 về `/student`.

- [x] **Step 1: Viết failing test cho `StudentBottomNav.test.tsx` và `Sidebar.test.tsx`**
- [x] **Step 2: Chạy test để xác nhận FAIL**
- [x] **Step 3: Cập nhật `Sidebar.tsx` và `StudentBottomNav.tsx`**
- [x] **Step 4: Chạy lại test để xác nhận PASS**
- [x] **Step 5: Commit**

---

### Task 2: Module Tiện Ích Phân Chặng Học & Lọc Đề Thi (`examMilestoneProgression.ts`)

**Files:**
- Create: `frontend/src/lib/examMilestoneProgression.ts`
- Test: `frontend/src/lib/examMilestoneProgression.test.ts`

**Interfaces:**
```typescript
export type ExamMilestone = 'midterm_1' | 'final_1' | 'midterm_2' | 'final_2' | 'topics';

export interface MilestoneInfo {
  id: ExamMilestone;
  title: string;
  typeMatch: string[]; // ['Giữa kì 1'], ['Cuối kì 1'], etc.
  order: number;
}

export function determineCurrentMilestone(submissions: any[], exams: any[]): ExamMilestone;
export function groupExamsByMilestone(exams: any[]): Record<ExamMilestone, any[]>;
```

- [x] **Step 1: Viết unit test cho `examMilestoneProgression.test.ts`**
- [x] **Step 2: Chạy test để xác nhận FAIL**
- [x] **Step 3: Triển khai code trong `frontend/src/lib/examMilestoneProgression.ts`**
- [x] **Step 4: Chạy lại test để xác nhận PASS**
- [x] **Step 5: Commit**

---

### Task 3: Giao Diện Lựa Chọn Chặng & Thẻ Đề Thi (`MilestoneTabs.tsx` & `MilestoneExamCard.tsx`)

**Files:**
- Create: `frontend/src/components/exams/MilestoneTabs.tsx`
- Create: `frontend/src/components/exams/MilestoneExamCard.tsx`
- Test: `frontend/src/components/exams/MilestoneTabs.test.tsx`
- Test: `frontend/src/components/exams/MilestoneExamCard.test.tsx`

**Interfaces:**
- `MilestoneTabs`:
  - Props: `activeMilestone: ExamMilestone`, `currentProgressMilestone: ExamMilestone`, `counts: Record<ExamMilestone, number>`, `onSelect: (m: ExamMilestone) => void`.
  - Hiển thị badge `🎯 Đang học` tại chặng hiện tại và badge `Đã qua` ở các chặng trước.
- `MilestoneExamCard`:
  - Props: `exam: any`, `bestSubmission?: any`, `isRecommended?: boolean`.
  - Hiển thị thẻ đề thi: Tiêu đề, Mã đề, Số câu hỏi, Thời gian làm bài, Điểm cao nhất đã đạt (nếu có), Badge phân loại `Thi thử` vs `Luyện tập`.
  - Nút bấm trực tiếp: `Làm bài thi` (trỏ đến `/exam/[id]/take`).

- [x] **Step 1: Viết failing test cho `MilestoneTabs.test.tsx` & `MilestoneExamCard.test.tsx`**
- [x] **Step 2: Chạy test để xác nhận FAIL**
- [x] **Step 3: Triển khai `MilestoneTabs.tsx` và `MilestoneExamCard.tsx`**
- [x] **Step 4: Chạy lại test để xác nhận PASS**
- [x] **Step 5: Commit**

---

### Task 4: Xây Dựng Trang Luyện Đề Thi (`/exams` & `/exams/lop/[grade]`)

**Files:**
- Modify: `frontend/src/app/(main)/(dashboardStudent)/exams/page.tsx`
- Create: `frontend/src/components/exams/StudentExamListClient.tsx`
- Modify: `frontend/src/app/(main)/(dashboardStudent)/exams/lop/[grade]/page.tsx`
- Test: `frontend/src/app/(main)/(dashboardStudent)/exams/lop/[grade]/page.test.tsx`

**Interfaces:**
- `/exams/page.tsx`: Đọc cookie `userGrade` (mặc định `'6'`), redirect sang `/exams/lop/${grade}` (thay vì redirect sang `/lectures`).
- `/exams/lop/[grade]/page.tsx`:
  - Fetch song song `getExams(grade)` và `getMyExamResults(token)`.
  - Tính toán chặng mục tiêu của học sinh qua `determineCurrentMilestone`.
  - Truyền dữ liệu xuống `StudentExamListClient`.
- `StudentExamListClient`:
  - Mặc định chọn Tab chặng hiện tại.
  - Cho phép chuyển đổi linh hoạt giữa các chặng để ôn tập đề cũ.
  - Có thanh tìm kiếm theo tên đề thi.

- [x] **Step 1: Viết test cho `page.test.tsx` của trang `/exams/lop/[grade]`**
- [x] **Step 2: Chạy test để xác nhận FAIL**
- [x] **Step 3: Cập nhật `/exams/page.tsx` và xây dựng `StudentExamListClient.tsx` + `page.tsx`**
- [x] **Step 4: Chạy lại test để xác nhận PASS**
- [x] **Step 5: Commit**

---

### Task 5: Phân Biệt Chế Độ Làm Bài `exam` vs `practice` Trong Phòng Thi (`/exam/[id]/take`)

**Files:**
- Modify: `frontend/src/app/(fullscreen)/exam/[id]/take/page.tsx`
- Test: `frontend/src/app/(fullscreen)/exam/[id]/take/page.test.tsx` (hoặc test tương ứng)

**Interfaces:**
- Kiểm tra `exam.cate`:
  - Nếu `exam.cate === 'practice'`:
    - Disable event listener `document.hidden` (không đếm phạt cheat khi mở tab bài giảng).
    - Hiển thị thông báo trên Header: `Chế độ Luyện tập: Cho phép mở tab bài giảng tra cứu lý thuyết`.
  - Nếu `exam.cate === 'exam'`:
    - Giữ nguyên anti-cheat giám sát tập trung.
    - Hiển thị thông báo trên Header: `Chế độ Thi thử: Giám sát tập trung, không rời phòng thi`.

- [x] **Step 1: Viết test kiểm tra trạng thái phòng thi theo `exam.cate`**
- [x] **Step 2: Chạy test để xác nhận FAIL**
- [x] **Step 3: Cập nhật logic `useEffect` trong `page.tsx`**
- [x] **Step 4: Chạy lại test để xác nhận PASS**
- [x] **Step 5: Commit**

---

### Task 6: Kiểm Thử Toàn Diện & Verification Loop

**Files:**
- Test all modified frontend & backend suites.

- [x] **Step 1: Chạy toàn bộ frontend unit tests liên quan**
- [x] **Step 2: Chạy toàn bộ backend unit tests**
- [x] **Step 3: Chạy TypeScript type-check trên frontend**
- [x] **Step 4: Commit tổng kết**

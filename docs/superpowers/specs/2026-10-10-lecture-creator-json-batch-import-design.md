# Design Specification: Lecture Creator JSON Batch Import

**Document ID**: `2026-10-10-lecture-creator-json-batch-import-design`  
**Date**: 2026-10-10  
**Status**: Draft  
**Scope**: Frontend Lecture Creator (`/dashboard/lectures/create`)

---

## 1. Mục tiêu (Objective)

Tối ưu hóa quy trình nhập liệu bài giảng Toán học trong trang `/dashboard/lectures/create`:
1. **Loại bỏ nút "Nhập JSON" cục bộ** trong từng thẻ con *BÀI TẬP MẪU* (`MethodCard` trong `DangToanCard.tsx`).
2. **Bổ sung nút "Nhập JSON" cấp toàn cục** tại hàng tiêu đề mục `2. Phân tích bài tập mẫu` trong `LectureContentEditor.tsx`, căn lề bên phải (`flex justify-between items-center`).
3. **Bộ Parser tự động bóc tách mảng JSON**:
   - Nhận mảng các Dạng toán (chứa `mathType`, `Solution`, `exams`).
   - Tự động phân rã thành danh sách `dangToanList` trong `LectureCreatorContext`:
     - `mathType` ➔ `dangToanName`.
     - `Solution` ➔ `methods[0].methodContent` (Nội dung lý thuyết phương pháp giải).
     - `exams` (danh sách các ví dụ) ➔ Tự động biên dịch toàn bộ các ví dụ (Đề bài, Timeline từng bước giải, Công thức Math Latex, Kết luận) thành HTML chuẩn và đưa vào `methods[0].exercise.content` (BÀI TẬP MẪU).
   - Nếu một phương pháp có nhiều ví dụ trong `exams` (Ví dụ 1, Ví dụ 2...), các ví dụ sẽ được nối tiếp nhau với dải phân cách trực quan rõ ràng.

---

## 2. Kiến trúc & Các file ảnh hưởng

### 2.1. File `frontend/src/components/lecture/creator/DangToanCard.tsx`
- **Loại bỏ**:
  - State: `isModalOpen`, `jsonInput`, `jsonError`.
  - Hàm: `handleSaveJson()`.
  - Giao diện: Nút `<Button>Nhập JSON</Button>` (lines 234-242) và khối Modal `isModalOpen` (lines 257-317).
- **Giữ nguyên**:
  - Khả năng thêm phương pháp giải cùng dạng toán (`addMethod`).
  - Trình soạn thảo `SharedEditorCard` cho *Nội dung phương pháp* và *BÀI TẬP MẪU*.

### 2.2. File `frontend/src/components/lecture/creator/LectureContentEditor.tsx`
- **Giao diện**:
  - Hàng tiêu đề `2. Phân tích bài tập mẫu` được chuyển thành container `flex items-center justify-between mb-4`.
  - Bên phải thêm nút bấm:
    ```tsx
    <Button
      variant="outline"
      onClick={() => setIsJsonModalOpen(true)}
      disabled={contentType === 'practice'}
      className="border-slate-300 hover:border-primary hover:text-primary transition-colors text-xs font-semibold h-8 px-3 bg-white shadow-sm flex items-center gap-1.5"
    >
      <Code className="w-3.5 h-3.5" />
      Nhập JSON
    </Button>
    ```
- **Modal Nhập JSON**:
  - Hộp thoại nhập Textarea chứa file JSON toàn bài.
  - Xử lý lỗi cú pháp JSON và thông báo lỗi rõ ràng.
  - Khi xác nhận: Chạy hàm `handleImportJson(jsonText)`.

---

## 3. Logic Parser & Mẫu dữ liệu (Data Parsing & Mapping)

### 3.1. Cấu trúc JSON đầu vào (Input Contract)
```json
[
  {
    "mathType": "Dạng 1. Nhận biết đơn thức",
    "Solution": "Đơn thức là biểu thức đại số...",
    "exams": [
      {
        "problem": "<b>Ví dụ 1.</b> Trong các biểu thức...",
        "conclusion": "Các biểu thức là đơn thức là:...",
        "problemImage": "",
        "solutionImage": "",
        "steps": [
          {
            "step": 1,
            "title": "Câu a",
            "content": "...",
            "formula": "-x^2y"
          }
        ]
      }
    ]
  }
]
```

### 3.2. Quy trình Parser (`buildExerciseHtmlFromExams`)
Đối với mỗi bài toán trong mảng `exams`:
1. Khối đề bài:
   ```html
   <div class="bg-slate-50 p-5 rounded-lg border border-slate-200 mb-6">
     <p class="italic text-slate-700 m-0">${exam.problem}</p>
   </div>
   ```
2. Khối Timeline các bước (`steps`), `conclusion`, `tips`:
   - Bước 1, 2, ...: Huy hiệu số màu xanh tròn `bg-blue-600`, tiêu đề `title`, giải thích `content`, công thức latex `formula` (bọc `$$`).
   - Kết luận: Huy hiệu xanh lá `bg-emerald-500 ✓`.
   - Gợi ý (nếu có): Huy hiệu vàng `bg-amber-500 💡`.
3. Nếu có từ 2 ví dụ trở lên: Đặt dải phân cách `<div class="my-8 border-t border-dashed border-slate-200"></div>` giữa các ví dụ.
4. Toàn bộ gói trong `<div class="exercise-content bg-white p-4">...</div>`.

### 3.3. Cập nhật State
- Sinh id ngẫu nhiên (`Math.random().toString(36).substr(2, 9)`).
- Gọi `setDangToanList(newDangToanList)`.
- Đóng modal và hiển thị `toast.success("Đã nhập thành công X dạng toán!")`.

---

## 4. Kiểm thử & Xác minh (Verification Plan)

1. **Kiểm tra giao diện (UI Verification)**:
   - Truy cập `http://localhost:3000/dashboard/lectures/create`.
   - Nút "Nhập JSON" xuất hiện ở hàng tiêu đề `2. Phân tích bài tập mẫu` bên phải.
   - Các thẻ BÀI TẬP MẪU con không còn nút "Nhập JSON".
2. **Kiểm tra chức năng nhập JSON**:
   - Dán dữ liệu 6 dạng toán mẫu do người dùng cung cấp.
   - Kiểm tra state: 6 thẻ Dạng toán được khởi tạo với tên chính xác (`Dạng 1...`, `Dạng 2...`).
   - Kiểm tra ô *Nội dung phương pháp* hiển thị đúng lý thuyết `Solution`.
   - Kiểm tra ô *BÀI TẬP MẪU* render chuẩn đề bài và timeline từng bước giải của tất cả các ví dụ.
3. **Kiểm tra build & regression**:
   - Chạy test suites hiện có bằng Vitest: `npm test`.

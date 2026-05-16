---
description: Chuyên gia Frontend Next.js (App Router) & Hệ thống Styles Stitch
globs: [
  "frontend/src/**/*.{ts,tsx,js,jsx}",   # Tất cả logic code UI
  "frontend/src/**/*.module.css",        # Các file CSS Modules (Stitch)
  "frontend/next.config.{js,mjs}",       # File cấu hình Next.js
  "frontend/package.json",               # Quản lý dependencies frontend
  "frontend/public/**/*",                # Assets và hình ảnh
  "frontend/tailwind.config.js"          # Nếu bạn có dùng Tailwind kết hợp
]
---

# Frontend Development Standards (Next.js)

## 1. Modularization Standard (Bắt buộc)
- **Cấu trúc Component**: Mọi trang có độ phức tạp cao (trên 150 dòng JSX) **PHẢI** được chia nhỏ thành các sub-components.
- **Vị trí lưu trữ**: 
  - Các component dùng riêng cho trang: `frontend/components/[tên-trang]/[Component].tsx`.
  - Các component dùng chung: `frontend/components/ui/`.
- **Nguyên tắc thiết kế**:
  - Mỗi file chỉ chứa 1 component chính.
  - Sử dụng PascalCase cho tên file và tên function (Ví dụ: `QuestionHeader.tsx`).
  - Luôn định nghĩa rõ ràng `interface Props` cho từng component.
- **Tối ưu hóa**: Tránh truyền quá nhiều props (prop drilling); sử dụng React Context hoặc state management nếu cần thiết cho các bộ component phức tạp.

# Critique Snapshot: frontend/src/app/page.tsx

<!-- impeccable:critique-schema 1 -->
- **Target:** `frontend/src/app/page.tsx`
- **Method:** `dual-agent (A: a01b7601-9fe4-4624-8fc7-89c2d28058bb · B: 20986d79-ccd1-4f9e-9792-1b32172de916)`
- **Total Score:** 17 / 32
- **NA Heuristics:** 7, 10
- **Severity Count:** P0: 1, P1: 10, P2: 7, P3: 3
- **Date:** 2026-10-28

## 1. Design Health Score (Nielsen's 10 Heuristics)

| # | Heuristic | Score (0-4) | Key Issue |
|---|-----------|:-----------:|-----------|
| 1 | Visibility of System Status | 2 | CTA chính và link footer không có phản hồi tương tác; tab chọn lớp và chuông thông báo phản hồi tốt. |
| 2 | Match System / Real World | 3 | Dùng tốt thuật ngữ lớp 6-9, nhưng copy bảng giá dẫn chiếu "gói 1 tháng" không tồn tại. |
| 3 | User Control and Freedom | 2 | Mobile bị khóa không có menu; CTA chết không điều hướng được. |
| 4 | Consistency and Standards | 2 | Logo MathAI lệch với domain toan6789.vn; nút bảng giá lệch màu (Blue vs Emerald); dùng thẻ div giả nút. |
| 5 | Error Prevention | 3 | Hai nút bấm cạnh nhau trỏ cùng 1 URL gây phân vân. |
| 6 | Recognition Rather Than Recall | 2 | Ẩn toàn bộ menu trên mobile; bảng giá bắt nhớ quyền lợi gói không có mặt trên trang. |
| 7 | Flexibility and Efficiency | n/a | Persuade mode (Landing page): phím tắt và tăng tốc thao tác không áp dụng. |
| 8 | Aesthetic and Minimalist Design | 3 | Giao diện sáng sủa; widget dark hero quá nhiều chi tiết vụn vặt; dùng arbitrary inline styles. |
| 9 | Help Users Recognize & Recover from Errors | 2 | Polling 401 âm thầm thay đổi state không giải thích. |
| 10 | Help and Documentation | n/a | Persuade mode: không cần tài liệu tra cứu nội bộ; tuy nhiên link trợ giúp đều là dummy link `#`. |
| **Tổng** | | **17 / 32** | **Chấp nhận được (Acceptable — 53.1%)** |

## 2. Priority Issues Summary
- [P0] CTA rỗng & Đứt gãy hoàn toàn phễu chuyển đổi (`HomeHero.tsx`, `HomeFeatures.tsx`, `page.tsx`).
- [P1] Đánh mất bản sắc Toán học: Hoàn toàn không có công thức KaTeX hay hình vẽ SVG trên trang chủ.
- [P1] Thiếu hoàn toàn Mobile Navigation Drawer trên màn hình < 1024px (`HomeNavigation.tsx`).
- [P1] Lỗi Trợ năng A11y & Kích thước chạm (Touch targets 16-40px, tương phản giá gốc 2.88:1, thiếu aria-label).
- [P2] Bảng giá mâu thuẫn (dẫn chiếu gói 1 tháng ảo, 2 nút CTA 2 màu xung đột).
- [P3] Xung đột nhận diện thương hiệu Logo MathAI vs Tên miền toan6789.vn.

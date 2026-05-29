---
name: Modern Academic (Google Material Inspired)
description: Một hệ thống thiết kế kết hợp sự rõ ràng của thiết kế học thuật với các tiêu chuẩn Material Design của Google. Tập trung vào trải nghiệm đọc, tính tương tác rõ ràng và khả năng hiển thị Toán học xuất sắc.
colors:
  primary: "#2563EB"
  on-primary: "#FFFFFF"
  primary-container: "rgba(37, 99, 235, 0.1)"
  on-primary-container: "#1D4ED8"
  
  surface: "#F8FAFC"
  on-surface: "#0F172A"
  background: "#FFFFFF"
  on-background: "#0F172A"
  
  outline: "rgba(226, 232, 240, 0.6)"
  outline-variant: "#F1F5F9"
  
  success: "#22C55E"
  warning: "#F59E0B"
  error: "#EF4444"
typography:
  display-lg:
    fontFamily: "Lexend, sans-serif"
    fontSize: 48px
    fontWeight: "700"
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: "Lexend, sans-serif"
    fontSize: 32px
    fontWeight: "600"
    lineHeight: 40px
  headline-md:
    fontFamily: "Lexend, sans-serif"
    fontSize: 24px
    fontWeight: "600"
    lineHeight: 32px
  body-lg:
    fontFamily: "Lexend, sans-serif"
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 28px
  body-md:
    fontFamily: "Lexend, sans-serif"
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  label-sm:
    fontFamily: "Lexend, sans-serif"
    fontSize: 12px
    fontWeight: "600"
    lineHeight: 16px
    letterSpacing: 0.05em
  math:
    fontFamily: "'Times New Roman', serif"
    fontSize: 16px
    fontWeight: "400"
rounded:
  DEFAULT: "0.25rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1rem"
  full: "9999px"
spacing:
  unit: 8px
  container-padding: 32px
  card-gap: 24px
  section-margin: 48px
components:
  card-standard:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.container-padding}"
    border: "1px solid {colors.outline}"
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
    hover:
      border: "1px solid rgba(37, 99, 235, 0.3)"
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.md}"
    height: 48px
    padding: 0 20px
    boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)"
  tag-label:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.DEFAULT}"
    padding: "2px 8px"
---

# Brand & Style (Modern Academic)
The **Modern Academic** design system is built for the "Toan24h" project. It merges the **Editorial Scholarship** philosophy with **Google's Material Design 3** accessibility and UX standards.

## Core Principles
1. **Accessibility First (A11y)**: Cỡ chữ nhỏ nhất (minimum size) được nâng lên `12px` (text-xs) để tuân thủ chuẩn Google về Legibility. Vùng chạm (Touch targets) trên thiết bị di động cần đảm bảo tối thiểu `48x48px` (hoặc `44x44px`).
2. **Typography Hierarchy**: Sử dụng `Lexend` đồng nhất cho toàn bộ giao diện (tiêu đề và nội dung) tạo cảm giác hiện đại, dễ đọc. Sử dụng `Times New Roman` ĐỘC QUYỀN cho môi trường render Toán học (LaTeX) để duy trì chất lượng học thuật.
3. **Outlined Elevation (Depth)**: Chiều sâu giao diện được thiết kế theo chuẩn M3 Outlined. Trạng thái nghỉ dùng viền rất mờ (`border-slate-200/60`) và bóng đổ nhẹ (`shadow-sm`). Khi tương tác (Hover), bóng đổ rõ hơn (`shadow-md`) và viền chuyển sang màu Primary (`border-primary/30`).
4. **Vibrant Yet Professional Palette**: Sử dụng nền Canvas trắng tinh (`#FFFFFF`) giúp tăng tối đa độ tương phản. Bề mặt nổi (Surface/Card) dùng nền Slate 50 (`#F8FAFC`). Màu chủ đạo là Blue 600 (`#2563EB`) tươi sáng nhưng vẫn chuyên nghiệp.

## Colors
- **Canvas**: Pure white `#FFFFFF` (page-bg).
- **Surface**: Slate 50 `#F8FAFC` (card-bg).
- **Primary**: Tailwind Blue 600 `#2563EB` (Dành cho nút bấm chính và hover states).
- **Semantic Tags**: Sử dụng background có độ trong suốt 10% kết hợp với chữ đậm (Green, Amber, Red) để làm các nhãn cảnh báo, thông báo nổi bật và thân thiện với mắt.

## Elevation & Depth (Cards)
- **Resting State**: `border-slate-200/60` và `shadow-sm`.
- **Hover/Active State**: `shadow-md` và `hover:border-primary/30`.
- **Selected State**: Khi người dùng đánh dấu chọn một thành phần (ví dụ chọn câu hỏi), card sẽ đổi màu nền sang `bg-primary/5` kết hợp `border-primary`.

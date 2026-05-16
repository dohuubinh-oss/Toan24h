# Project: ExamModel

Hệ thống quản lý và tạo đề thi chuyên nghiệp, tích hợp Everything Claude Code (ECC) và Superpowers.

## Hệ thống Phát triển (Development Systems)

Dự án này sử dụng sự kết hợp giữa **ECC** (Hạ tầng & Tiêu chuẩn) và **Superpowers** (Phương pháp luận & Kỷ luật).

### 1. Superpowers Methodology (Quy trình chính)
Dự án tuân thủ nghiêm ngặt các **Thiết luật (Iron Laws)** của Superpowers:
- **Brainstorming First**: Luôn phản biện yêu cầu trước khi làm.
- **Bite-sized Planning**: Kế hoạch chia nhỏ 2-5 phút.
- **Strict TDD**: Test trước, code sau. Không test = Xóa code.
- **Subagent SDD**: Chạy subagent cho từng task biệt lập.

Xem chi tiết tại: [.agent/rules/superpowers.md](file:///Users/modeptrai/Desktop/examModel/.agent/rules/superpowers.md)

### 2. ECC Infrastructure (`.agent/`)
- **Quy tắc (`.agent/rules/`)**: Chứa 110+ quy chuẩn kỹ thuật (TS, Go, Security).
- **Kỹ năng (`.agent/skills/`)**: Thư viện kỹ năng chuyên sâu (Superpowers & ECC skills).
- **Quy trình (`.agent/workflows/`)**: Slash commands điều khiển dự án.

## 🛡️ ABSOLUTE ISOLATION POLICY (CRITICAL)

- **NO CROSS-PROJECT MEMORY**: Bạn tuyệt đối không được tham chiếu, nhắc đến hoặc sử dụng bất kỳ ngữ cảnh, mã nguồn hoặc kiến thức nào từ các dự án cũ (như `ToanTHCS`, `mau2`, `mau3`).
- **PROJECT ROOT BOUNDARY**: Phạm vi hoạt động của bạn bị giới hạn nghiêm ngặt trong thư mục `/Users/modeptrai/Desktop/examModel`.
- **CLEAN SLATE**: Hãy coi đây là dự án duy nhất tồn tại. Không áp dụng các mẫu UI, quyết định kiến trúc hoặc logic nghiệp vụ từ các dự án trước đó trừ khi được quy định rõ ràng trong repo này.

## Slash Commands (Workflows)

- `/plan`: Lập kế hoạch theo chuẩn Superpowers.
- `/tdd`: Thực hiện quy trình TDD.
- `/review`: Kiểm tra mã nguồn.
- `/brainstorm`: Bắt đầu phiên thảo luận thiết kế.

## Tài liệu tham khảo
- [Superpowers README](file:///Users/modeptrai/Desktop/examModel/superpowers_temp/README.md)
- [ECC README](file:///Users/modeptrai/Desktop/examModel/.agent/rules/README.md)

---
*Dự án được bảo vệ và tối ưu bởi Superpowers & ECC.*
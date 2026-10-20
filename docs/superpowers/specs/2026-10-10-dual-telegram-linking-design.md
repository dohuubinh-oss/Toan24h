# Design Specification: Dual Telegram Account Linking (Student & Parent)

**Date:** 2026-10-10  
**Project:** toan6789.vn  
**Status:** Approved  

---

## 1. Overview & Objectives

Allow a single user account on **toan6789.vn** to link with **up to 2 separate Telegram accounts**:
1. **Telegram 1 (Học sinh)**: Primary account for student notifications and direct login.
2. **Telegram 2 (Phụ huynh)**: Secondary account for parents to monitor study progress, exam scores, OTP recovery, and security alerts.

Both accounts have the ability to:
- Receive real-time notifications (Exam results, OTP password recovery, security changes).
- Log into the user's account via Telegram Login Widget or mobile QR code.
- Be independently linked and unlinked from the user's Profile settings.

---

## 2. Architecture & Data Model

### 2.1. Backend Database Model (`backend/internal/models/user.go`)
Extend `User` struct with secondary Telegram fields:
```go
type User struct {
    // Slot 1 (Học sinh)
    TelegramID   *int64  `gorm:"index" json:"telegramId"`
    TelegramUser *string `gorm:"type:varchar(255)" json:"telegramUsername"`
    TelegramAvt  *string `gorm:"type:text" json:"telegramPhotoUrl"`

    // Slot 2 (Phụ huynh)
    TelegramID2   *int64  `gorm:"index" json:"telegramId2"`
    TelegramUser2 *string `gorm:"type:varchar(255)" json:"telegramUsername2"`
    TelegramAvt2  *string `gorm:"type:text" json:"telegramPhotoUrl2"`
}
```

### 2.2. Authentication & Linking Handlers (`backend/internal/handlers/auth_telegram.go`)
1. **`TelegramLogin`**:
   - Query: `db.Where("telegram_id = ? OR telegram_id2 = ?", req.ID, req.ID).First(&user)`
   - Logs in the matched user seamlessly regardless of which Telegram account is used.
2. **`LinkTelegram`**:
   - Accepts `slot: 1 | 2` (default 1).
   - Validates that the target Telegram ID is not already claimed by another user's `telegram_id` or `telegram_id2`.
   - Saves to slot 1 (`telegram_id`, `telegram_user`, `telegram_avt`) or slot 2 (`telegram_id2`, `telegram_user2`, `telegram_avt2`).
3. **`UnlinkTelegram`**:
   - Endpoint: `POST /api/v1/users/me/unlink-telegram` with body `{ "slot": 1 | 2 }`.
   - Sets the corresponding slot fields to `nil`.
4. **Mobile QR / Bot Session Linking (`telegram_auth_service.go`)**:
   - `TelegramQRSessionData` includes `LinkSlot string` ("1" or "2").
   - Deep link and bot authentication `/start login_<sessionId>` links directly to the specified slot.

### 2.3. Multi-Channel Notification Dispatch (`telegram_notifier.go`)
Add `SendToUser(user *models.User, text string)`:
```go
func (n *TelegramNotifier) SendToUser(user *models.User, text string) error {
    var err error
    if user.TelegramID != nil {
        err = n.SendMessage(*user.TelegramID, text)
    }
    if user.TelegramID2 != nil {
        _ = n.SendMessage(*user.TelegramID2, text)
    }
    return err
}
```
Update all notification dispatches:
- `auth_handler.go`: OTP recovery & password changed alerts.
- `exam_result_handler.go`: Exam submission score updates.

---

## 3. Frontend Architecture

### 3.1. Profile Page (`frontend/src/app/(main)/profile/page.tsx`)
- Display 2 distinct, beautiful connection cards:
  1. **Telegram 1 (Học sinh)**:
     - Badge & Icon: Student / Primary
     - Status: Connected (@username / ID) or Not connected
     - Actions: `TelegramLoginWidget (slot=1)` or "Hủy liên kết" button
  2. **Telegram 2 (Phụ huynh)**:
     - Badge & Icon: Parent / Secondary
     - Status: Connected (@username / ID) or Not connected
     - Actions: `TelegramLoginWidget (slot=2)` or "Hủy liên kết" button

### 3.2. Telegram Login Widget (`frontend/src/components/auth/TelegramLoginWidget.tsx`)
- Add `slot?: 1 | 2` prop.
- Forward `slot` to `/auth/telegram-qr/session` to initiate QR session for the selected slot.

---

## 4. Test Strategy

1. **Backend Tests**:
   - `auth_telegram_test.go`: Test linking slot 1 and slot 2, test login with slot 1 and slot 2, test collision detection (cannot link a Telegram ID already in use), test unlinking.
   - `telegram_notifier_test.go`: Test `SendToUser` dispatches to both IDs.
2. **Frontend Tests**:
   - `profile/page.test.tsx`: Verify rendering of 2 Telegram slots, linking button triggers, and unlinking action.

# Design Specification: Email-Only Authentication & Forgot Password Flow

**Date:** 2026-10-10  
**Project:** toan6789.vn  
**Status:** Approved  

---

## 1. Overview & Objectives

Update the user authentication system on **toan6789.vn** to:
1. **Email-Only Auth:** Exclusively accept standard email addresses for login and registration (removing phone number regex and labels).
2. **Forgot Password via Email OTP:** Provide an intuitive 3-step password recovery flow (Request OTP -> Verify OTP -> Set New Password).
3. **Multi-Channel Notification:** In addition to sending the OTP email, automatically deliver the OTP and password-change security alerts via Telegram bot if the user's account is linked to Telegram (`telegramId != nil`).

---

## 2. Architecture & Detailed Design

### 2.1. Frontend Changes

#### `LoginForm.tsx` & `RegisterForm.tsx`
- **Field Label:** Change from "Số điện thoại hoặc Email" to "Email".
- **Placeholder:** `name@example.com` or `vidu@gmail.com`.
- **Validation Rule:** Strict email format matching RFC 5322 regex:
  ```ts
  pattern: {
    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Địa chỉ email không hợp lệ (ví dụ: name@gmail.com)'
  }
  ```
- **Error Messages:**
  - Required: "Vui lòng nhập địa chỉ email"
  - Format: "Địa chỉ email không hợp lệ"

#### `ForgotPasswordForm.tsx`
- **Step 1: Input Email & Request OTP**
  - Input: Valid email address.
  - Action: Calls `POST /api/v1/auth/forgot-password`.
  - Feature: 60s cooldown timer for resending OTP.
- **Step 2: 6-Digit OTP Verification**
  - Input: 6 separate numerical boxes with auto-focus and clipboard paste support.
  - Action: Calls `POST /api/v1/auth/verify-otp`.
- **Step 3: Reset Password**
  - Input: New password (min 6 chars) and confirm password.
  - Action: Calls `POST /api/v1/auth/reset-password`.
  - Outcome: Displays success toast, clears OTP session, and redirects to `/login` after 1.5s.

---

### 2.2. Backend Changes

#### `AuthHandler` (`backend/internal/handlers/auth_handler.go`)
- **`ForgotPassword`**:
  - Validates `email` format.
  - Checks if user exists in database.
  - Generates 6-digit numeric OTP and stores in Redis with 10-minute expiration (`otpService.SaveOTP`).
  - Sends email with HTML template (`emailService.SendOTPEmail`).
  - If `user.TelegramID != nil`, sends instant OTP alert via Telegram bot (`telegramNotifier.SendMessage`).
- **`VerifyOTP`**:
  - Validates `email` and `otp` against Redis store.
- **`ResetPassword`**:
  - Verifies OTP again.
  - Hashes new password with bcrypt and updates `user.PasswordHash`.
  - Deletes OTP from Redis.
  - If `user.TelegramID != nil`, sends security notification via Telegram bot notifying that password was changed.

---

## 3. Data Flow & Security

1. **OTP Rate Limiting & Expiry**: OTPs expire in 600 seconds (10 minutes) and are single-use (deleted upon successful reset).
2. **Password Security**: Passwords must be at least 6 characters and hashed using `bcrypt` (cost 10).
3. **Session Invalidation**: Once reset, user must log in again to generate fresh JWT tokens.

---

## 4. Test Strategy

1. **Frontend Tests**:
   - `LoginForm.test.tsx`: Verify email-only validation, error messages on invalid email formats, successful login.
   - `RegisterForm.test.tsx`: Verify registration with email.
   - `ForgotPasswordForm.test.tsx`: Test Step 1 request, Step 2 OTP verification, Step 3 password reset with redirection.
2. **Backend Tests**:
   - `auth_handler_test.go`: Test `ForgotPassword`, `VerifyOTP`, and `ResetPassword` endpoints including error cases (non-existent email, invalid OTP, short password).

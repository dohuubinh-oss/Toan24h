# Design Spec: Google Auth Integration, Telegram Login Removal & Password Reset Verification

**Date:** 2026-10-11  
**Project:** toan6789.vn  
**Author:** Pair Programming Agent & User  

---

## 1. Context & Motivation
Currently, users can authenticate using Email/Password or Telegram via `TelegramLoginWidget`. However:
- Telegram login is to be completely deprecated for authentication. Telegram will strictly serve as a notification channel (for exam submissions, grading results, score updates, and security alerts).
- Google Sign-In (OAuth2 / Google Identity Services) will become the standard third-party login method alongside Email/Password.
- The forgot password flow needs audit and verification, especially concerning SMTP configuration and Telegram notification fallback.

---

## 2. Requirements & Scope

### 2.1 Telegram Authentication Deprecation
- **Frontend:**
  - Remove `TelegramLoginWidget` from `frontend/src/components/auth/LoginForm.tsx` and `frontend/src/components/auth/RegisterForm.tsx`.
  - Keep Telegram linking in `frontend/src/app/(main)/profile/page.tsx` for notification reception.
- **Backend:**
  - `POST /api/v1/auth/telegram`: Return `403 Forbidden` with message `"Đăng nhập bằng Telegram không còn được hỗ trợ. Vui lòng đăng nhập qua Email hoặc tài khoản Google."`
  - Keep `LinkTelegram` (`POST /api/v1/auth/telegram/link`) and `UnlinkTelegram` (`POST /api/v1/auth/telegram/unlink`) active for user notification preferences.
  - Retain `services.TelegramNotifier` for sending transactional notifications (exam submissions, grade notifications, OTP messages if user linked Telegram).

### 2.2 Google Authentication Integration
- **Backend:**
  - Add `GoogleID *string` (`gorm:"type:varchar(255);index" json:"googleId,omitempty"`) to `models.User`.
  - Implement `POST /api/v1/auth/google` accepting payload `{"credential": string}` (the Google JWT ID token).
  - Verify ID token with Google's tokeninfo API (`https://oauth2.googleapis.com/tokeninfo?id_token=...`) ensuring `aud` matches `GOOGLE_CLIENT_ID` (if set) and email is verified (`email_verified == "true"`).
  - Account linking & Creation:
    - If user exists by `email`: update `GoogleID` (if not already set), generate JWT tokens, set standard authentication cookies (`accessToken`, `refreshToken`, `userRole`, `userGrade`, `userExpiresAt`), and return user info.
    - If user does not exist: create a new user with `Email`, `FullName` (from Google `name`), `GoogleID` (from Google `sub`), `Role: "student"`, generate JWT tokens, set authentication cookies, and return user info.
- **Frontend:**
  - Implement a modern Google Sign-In button on both `/login` and `/register`.
  - Load Google Identity Services script asynchronously (`https://accounts.google.com/gsi/client`) or provide Google OAuth button component with standard Google branding and SVG logo.
  - On receiving Google credential, call `POST /api/v1/auth/google`, save user to `localStorage`, set cookies, and redirect appropriately (Admin/Teacher -> `/dashboard/lectures`, Student -> `/lectures`).

### 2.3 Forgot Password Verification & Hardening
- **Frontend:**
  - In `ForgotPasswordForm.tsx`, provide clear messaging that OTP is sent to the registered email address (and Telegram bot if linked).
  - Verify all 3 steps: Step 1 (Email), Step 2 (6-digit OTP input), Step 3 (New Password).
- **Backend:**
  - Ensure OTP generation, storage (Redis with in-memory fallback), and verification works reliably.
  - In `ResetPassword`, allow accounts created via Google (which previously had an empty `PasswordHash`) to establish a password so they can log in via both methods.
  - Document required Dokku VPS SMTP configuration (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`).

---

## 3. Tech Stack & Non-Goals
- **Tech Stack:** Go (Gin, GORM, PostgreSQL, Redis), Next.js 16 (Turbopack, React, Tailwind CSS, Lucide icons).
- **Non-Goals:**
  - Do not delete existing users who were created via Telegram in the past; they can log in via Google if using the same email or set a password via Forgot Password.
  - Do not modify Telegram notification delivery logic (`telegram_notifier.go`).

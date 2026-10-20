# Google Sign-In Integration, Telegram Login Deprecation & Forgot Password Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Telegram login with Google authentication across frontend and backend, retain Telegram solely for notifications, and verify the password reset workflow.

**Architecture:** 
1. Deprecate Telegram login endpoint on backend, returning 403 while keeping notification and linking capabilities intact.
2. Add `GoogleID` to User model and create `POST /api/v1/auth/google` with Google token validation, auto-registration for students, and session cookie generation.
3. Replace Telegram widget with standard Google Sign-In on frontend login/register forms, and audit the OTP password reset flow.

**Tech Stack:** Go 1.26 (Gin, GORM, PostgreSQL, Redis), Next.js 16 (React 19, Turbopack, Tailwind CSS, TypeScript), Vitest, Google Identity Services.

**Spec:** `docs/superpowers/specs/2026-10-11-auth-google-telegram-forgot-password-design.md`

## Global Constraints
- Backend language: Go 1.26 with Gin and GORM.
- Frontend: Next.js 16 with React 19, App Router, TypeScript, Tailwind CSS.
- TDD: Every backend handler and frontend component change must have automated tests.
- Absolute isolation: All paths must stay within `/Users/modeptrai/Desktop/toan6789.vn`.

## Review Focus
1. User with existing email logs in with Google -> Must link GoogleID and not create duplicate account.
2. Brand new user logs in with Google -> Must auto-create account with role `student`, status `active`, and valid tokens.
3. User attempts to call deprecated `POST /api/v1/auth/telegram` -> Must receive HTTP 403 with clear Vietnamese deprecation message.
4. User created via Google resets password via forgot-password flow -> Must successfully set password and be able to log in with email/password.
5. Telegram notification linking in `/profile` -> Must remain fully operational.

---

### Task 1: Deprecate Telegram Login on Backend

**Files:**
- Modify: `backend/internal/handlers/auth_telegram.go`
- Test: `backend/internal/handlers/auth_telegram_test.go`

**Interfaces:**
- Consumes: Gin context, `POST /api/v1/auth/telegram`
- Produces: `403 Forbidden` JSON response: `{"error": "Đăng nhập bằng Telegram không còn được hỗ trợ. Vui lòng đăng nhập qua Email hoặc tài khoản Google."}`

- [ ] **Step 1: Write test in `auth_telegram_test.go` checking TelegramLogin returns 403**
- [ ] **Step 2: Run test to verify it fails**
  Run: `go test -v ./internal/handlers -run TestTelegramLogin`
- [ ] **Step 3: Update `TelegramLogin` in `backend/internal/handlers/auth_telegram.go` to return 403 with message**
- [ ] **Step 4: Run test to verify it passes**
  Run: `go test -v ./internal/handlers -run TestTelegramLogin`
- [ ] **Step 5: Commit**
  Run: `git add backend/internal/handlers/auth_telegram.go backend/internal/handlers/auth_telegram_test.go && git commit -m "feat(auth): deprecate telegram login on backend"`

---

### Task 2: Backend Google Authentication Endpoint

**Files:**
- Modify: `backend/internal/models/user.go`
- Create: `backend/internal/handlers/auth_google.go`
- Create: `backend/internal/handlers/auth_google_test.go`
- Modify: `backend/internal/routes/routes.go`

**Interfaces:**
- Consumes: `POST /api/v1/auth/google` with payload `{"credential": string}`
- Produces: Session cookies (`accessToken`, `refreshToken`, `userRole`, `userGrade`, `userExpiresAt`) and HTTP 200 with user profile JSON.

- [ ] **Step 1: Add `GoogleID *string` to `models.User` in `backend/internal/models/user.go`**
- [ ] **Step 2: Write failing unit tests for Google login (existing user linking & new student auto-registration) in `auth_google_test.go`**
- [ ] **Step 3: Run test to verify it fails**
  Run: `go test -v ./internal/handlers -run TestGoogleLogin`
- [ ] **Step 4: Implement `GoogleLogin` handler in `backend/internal/handlers/auth_google.go` and register route in `routes.go`**
  - Verify credential via Google tokeninfo endpoint (or mock validator in tests)
  - If user exists by email, update `GoogleID` if nil, issue JWTs and cookies
  - If user does not exist, create student user with Google name, email, googleId, issue JWTs and cookies
- [ ] **Step 5: Run tests to verify they pass**
  Run: `go test -v ./internal/handlers -run TestGoogleLogin`
- [ ] **Step 6: Commit**
  Run: `git add backend/internal/models/user.go backend/internal/handlers/auth_google.go backend/internal/handlers/auth_google_test.go backend/internal/routes/routes.go && git commit -m "feat(auth): add google sign-in handler and route"`

---

### Task 3: Frontend Google Sign-In Component and API Client

**Files:**
- Create: `frontend/src/components/auth/GoogleSignInButton.tsx`
- Create: `frontend/src/components/auth/GoogleSignInButton.test.tsx`
- Modify: `frontend/src/lib/authApi.ts`

**Interfaces:**
- Consumes: `loginWithGoogle(credential: string)` calling `POST /auth/google`
- Produces: GoogleSignInButton component supporting Google Identity Services flow with clean fallback/branding

- [ ] **Step 1: Add `loginWithGoogle` function in `frontend/src/lib/authApi.ts`**
- [ ] **Step 2: Write component test `GoogleSignInButton.test.tsx` verifying render and click/auth event**
- [ ] **Step 3: Run test to verify failure**
  Run: `cd frontend && npm test -- src/components/auth/GoogleSignInButton.test.tsx`
- [ ] **Step 4: Implement `GoogleSignInButton.tsx` with Google brand SVG and GIS loader**
- [ ] **Step 5: Run test to verify pass**
  Run: `cd frontend && npm test -- src/components/auth/GoogleSignInButton.test.tsx`
- [ ] **Step 6: Commit**
  Run: `git add frontend/src/lib/authApi.ts frontend/src/components/auth/GoogleSignInButton.tsx frontend/src/components/auth/GoogleSignInButton.test.tsx && git commit -m "feat(auth): create GoogleSignInButton and api client"`

---

### Task 4: Replace Telegram Login Widget on Login & Register Pages

**Files:**
- Modify: `frontend/src/components/auth/LoginForm.tsx`
- Modify: `frontend/src/components/auth/RegisterForm.tsx`
- Test: `frontend/src/components/auth/LoginForm.test.tsx`

**Interfaces:**
- Consumes: `GoogleSignInButton`
- Produces: Updated login and register pages with Google authentication and without Telegram login widget

- [x] **Step 1: Check existing LoginForm tests or add test verifying Google login button is present and Telegram widget is absent**
- [x] **Step 2: Replace Telegram widget with `GoogleSignInButton` in `LoginForm.tsx` and `RegisterForm.tsx`**
- [x] **Step 3: Run frontend tests to verify they pass**
  Run: `cd frontend && npm test`
- [x] **Step 4: Commit**
  Run: `git add frontend/src/components/auth/LoginForm.tsx frontend/src/components/auth/RegisterForm.tsx && git commit -m "feat(auth): replace telegram login with google sign-in on login and register forms"`

---

### Task 5: Verify and Harden Forgot Password & Reset Password Flow

**Files:**
- Modify: `frontend/src/components/auth/ForgotPasswordForm.tsx`
- Modify: `backend/internal/handlers/auth_handler.go`
- Test: `frontend/src/components/auth/ForgotPasswordForm.test.tsx`
- Test: `backend/internal/handlers/auth_test.go`

**Interfaces:**
- Consumes: `/auth/forgot-password`, `/auth/verify-otp`, `/auth/reset-password`
- Produces: Informative messaging about Email & Telegram bot OTP delivery, and robust password setting for Google-registered users

- [x] **Step 1: Write test for password reset on user with empty password (Google-created user)**
- [x] **Step 2: Run test to verify behavior**
  Run: `go test -v ./internal/handlers -run TestResetPassword`
- [x] **Step 3: Update `ForgotPasswordForm.tsx` with explicit prompt that OTP is sent to Email (and Telegram bot if linked)**
- [x] **Step 4: Run frontend tests for `ForgotPasswordForm`**
  Run: `cd frontend && npm test -- src/components/auth/ForgotPasswordForm.test.tsx`
- [x] **Step 5: Commit**
  Run: `git add frontend/src/components/auth/ForgotPasswordForm.tsx backend/internal/handlers/auth_handler.go && git commit -m "feat(auth): harden forgot password and reset password flow"`

---

### Task 6: Build Verification & Local Testing (VPS Deployment Skipped Per Instruction)

**Files:**
- Local verification only: `backend` and `frontend`

- [x] **Step 1: Run full backend tests: `cd backend && go test ./...`** (auth handler tests PASS, binary compilation PASS)
- [x] **Step 2: Run full frontend build: `cd frontend && npm run build`** (Next.js 16 build PASS with 0 errors)
- [ ] **Step 3: Push changes to GitHub `origin/main`** (Deferred / user review)
- [ ] **Step 4: Deploy updated backend and frontend to Dokku VPS** (Skipped per user instruction "thực hiện trên local thôi nhé")
- [ ] **Step 5: Verify public endpoints on VPS** (Skipped)

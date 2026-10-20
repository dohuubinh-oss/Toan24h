# Email-Only Auth & Forgot Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor frontend and backend to support email-only authentication and implement the 3-step forgot password flow with email OTP and Telegram notification alerts.

**Architecture:** Frontend uses React Hook Form with strict email regex validation in `LoginForm`, `RegisterForm`, and `ForgotPasswordForm`. Backend Gin handlers in `auth_handler.go` handle OTP generation, validation, password reset with bcrypt, and send multi-channel alerts (Email SMTP + Telegram Bot).

**Tech Stack:** Next.js (React 19, TypeScript, TailwindCSS, Lucide), Go (Gin, GORM, bcrypt, net/smtp), Redis (go-redis), Vitest, testing-library.

## Global Constraints

- No phone numbers allowed for login/register; email is the sole credential identifier.
- RFC 5322 standard email regex on frontend and backend validation.
- OTPs expire in 10 minutes (600 seconds) in Redis.
- Passwords must be at least 6 characters.
- If user has `telegram_id`, send OTP and password reset alert via Telegram bot.
- All tests in Vitest and Go must pass without errors.

---

### Task 1: Update Frontend Login & Register Forms to Email-Only

**Files:**
- Modify: `frontend/src/components/auth/LoginForm.tsx`
- Modify: `frontend/src/components/auth/RegisterForm.tsx`
- Test: `frontend/src/components/auth/LoginForm.test.tsx`

**Interfaces:**
- Consumes: `login`, `registerUser` from `@/lib/authApi`
- Produces: UI with label "Email", placeholder `name@example.com`, strict email validation regex.

- [x] **Step 1: Update LoginForm.test.tsx with email-only validation tests**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Update LoginForm.tsx and RegisterForm.tsx**
- [x] **Step 4: Run tests to verify they pass**
- [x] **Step 5: Commit**

---

### Task 2: Backend Forgot Password & Multi-Channel Telegram Alert

- [x] **Step 1: Write backend tests in auth_handler_test.go**
- [x] **Step 2: Run Go tests to check baseline**
- [x] **Step 3: Implement Telegram Notification in ForgotPassword and ResetPassword**
- [x] **Step 4: Run Go tests to verify PASS**
- [x] **Step 5: Commit**

---

### Task 3: Enhance ForgotPasswordForm Component & Integration

- [x] **Step 1: Write ForgotPasswordForm.test.tsx**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement 60s cooldown timer and polished UI in ForgotPasswordForm.tsx**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 4: Full End-to-End Verification & Quality Gate

- [x] **Step 1: Run complete frontend unit tests**
- [x] **Step 2: Run complete backend unit tests**
- [x] **Step 3: Visual check on browser with browser_subagent**


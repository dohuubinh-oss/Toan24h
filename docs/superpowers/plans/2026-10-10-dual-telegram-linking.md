# Dual Telegram Linking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement dual Telegram account linking (Slot 1: Học sinh, Slot 2: Phụ huynh) allowing 1 user account to connect with 2 separate Telegram accounts, receive dual notifications, and log in with either account.

**Architecture:** Extend backend `models.User` with `TelegramID2`, `TelegramUser2`, `TelegramAvt2`. Update Gin handlers for multi-slot linking, unlinking, login lookups, and dual notification broadcasting. Update frontend `TelegramLoginWidget` and `ProfilePage` to manage both Telegram accounts independently.

**Tech Stack:** Next.js (React 19, TypeScript, TailwindCSS), Go (Gin, GORM, Telegram Bot API), Vitest, testing-library.

---

### Task 1: Update Backend User Model & Database Schema
**Files:**
- Modify: `backend/internal/models/user.go`
- Modify: `backend/internal/handlers/user_handler.go` (GetProfile data payload)

- [x] **Step 1: Add TelegramID2, TelegramUser2, TelegramAvt2 to User model**
- [x] **Step 2: Update GetProfile response to include slot 2 fields**
- [x] **Step 3: Run backend compile/test to verify syntax**

---

### Task 2: Implement Multi-Slot Telegram Linking, Unlinking & Login
**Files:**
- Modify: `backend/internal/handlers/auth_telegram.go`
- Modify: `backend/internal/services/telegram_auth_service.go`
- Modify: `backend/internal/services/telegram_notifier.go`
- Modify: `backend/internal/handlers/auth_handler.go`
- Modify: `backend/internal/routes/routes.go`
- Create/Modify: `backend/internal/handlers/auth_telegram_test.go`

- [x] **Step 1: Write backend tests for linking slot 1 & slot 2, unlinking, and dual login**
- [x] **Step 2: Implement slot support in LinkTelegram and add UnlinkTelegram handler**
- [x] **Step 3: Update TelegramLogin and CompleteTelegramLoginDirect to query both slots**
- [x] **Step 4: Implement SendToUser in TelegramNotifier and update OTP/Security alerts**
- [x] **Step 5: Register UnlinkTelegram in routes.go**
- [x] **Step 6: Run Go tests to verify PASS**
- [x] **Step 7: Commit backend changes**

---

### Task 3: Update Frontend Widget & Profile UI for 2 Telegram Accounts
**Files:**
- Modify: `frontend/src/components/auth/TelegramLoginWidget.tsx`
- Modify: `frontend/src/app/(main)/profile/page.tsx`
- Create/Modify: `frontend/src/app/(main)/profile/page.test.tsx`

- [x] **Step 1: Update TelegramLoginWidget to support `slot?: 1 | 2`**
- [x] **Step 2: Update Profile page with 2 Telegram cards (Học sinh & Phụ huynh) + Unlink handlers**
- [x] **Step 3: Write / update tests in profile/page.test.tsx**
- [x] **Step 4: Run Vitest tests to verify PASS**
- [x] **Step 5: Commit frontend changes**

---

### Task 4: Full End-to-End Verification
- [x] **Step 1: Run all backend Go tests**
- [x] **Step 2: Run all frontend Vitest tests**
- [x] **Step 3: Browser check on `/profile`**


# Telegram Login Unification & Authentication Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the Telegram login button into a single, clean "Đăng nhập với Telegram" button that opens a focused QR Code modal (removing unnecessary texts/buttons), fix the `Invalid request payload` callback bug, and ensure cross-domain authentication cookies and feedback work seamlessly for password login.

**Architecture:** 
- Frontend: Replace the official script-based Telegram widget with a custom branded button leading to an instant QR modal. Remove duplicate callback calls to `/auth/telegram-login` when QR authentication is already completed. Add client-side cookie synchronization and visible toast notifications.
- Backend: Centralize cookie issuance with cross-domain support (`.toan6789.vn`, `Secure`, `SameSite=Lax` in production).

**Tech Stack:** Next.js 16 (React 19), Tailwind CSS, Lucide Icons, Go 1.26, Gin Web Framework, Dokku PaaS.

## Global Constraints
- Do not introduce breaking API changes to existing endpoints.
- Keep the UI responsive, modern, and aligned with Telegram brand colors (`#24A1DE`).
- Preserve role-based routing (Admin/Teacher -> `/dashboard/lectures`, Student -> `/lectures`).

---

### Task 1: Refactor `TelegramLoginWidget.tsx` for Unified Button and Clean QR Modal

**Files:**
- Modify: `frontend/src/components/auth/TelegramLoginWidget.tsx`

**Interfaces:**
- Produces: `TelegramLoginWidget({ botName, onAuthSuccess }: { botName: string; onAuthSuccess: (user: any) => void })`

- [ ] **Step 1: Update component to remove iframe script, remove unwanted modal elements, and fix callback**

In `frontend/src/components/auth/TelegramLoginWidget.tsx`:
1. Remove all Telegram widget script injection code.
2. Render a single clean Telegram button:
   - Label: `Đăng nhập với Telegram`
   - Background: `#24A1DE` hover `#208ec4`
   - Icon: `Send` (Telegram paper plane)
3. In QR modal:
   - Remove text: `Quét mã QR bằng điện thoại hoặc bấm nút mở ứng dụng Telegram bên dưới.`
   - Remove button: `Mở ứng dụng Telegram trên Điện thoại`.
   - Keep QR Code (size 200px) centered with clean container.
   - Keep 3-step guide:
     1. Dùng camera điện thoại hoặc app Telegram để quét mã QR trên.
     2. Nhấn nút **Bắt đầu (Start)** trong chat với bot `@toan6789_bot`.
     3. Màn hình máy tính sẽ **tự động đăng nhập**.
4. When `status === 'completed'`:
   - Store user in localStorage.
   - Set client cookies `userRole` and `userGrade`.
   - Call `onAuthSuccess(res.user)`.

- [ ] **Step 2: Typecheck frontend**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit Task 1**

```bash
git add frontend/src/components/auth/TelegramLoginWidget.tsx
git commit -m "feat(auth): unify Telegram login button and clean QR modal"
```

---

### Task 2: Update `LoginForm.tsx` and `RegisterForm.tsx` with Clear Feedback & Direct Navigation

**Files:**
- Modify: `frontend/src/components/auth/LoginForm.tsx`
- Modify: `frontend/src/components/auth/RegisterForm.tsx`

**Interfaces:**
- Consumes: `onAuthSuccess(user)` from `TelegramLoginWidget`

- [ ] **Step 1: Update LoginForm.tsx**
1. Replace `handleTelegramAuth` with `handleTelegramSuccess`:
   - Direct redirect without calling `/auth/telegram-login`:
     ```tsx
     const handleTelegramSuccess = (user: any) => {
       toast.success(`Xin chào ${user.fullName || 'bạn'}! Đang chuyển hướng...`);
       if (user.role === 'admin' || user.role === 'teacher') {
         window.location.href = '/dashboard/lectures';
       } else {
         window.location.href = '/lectures';
       }
     };
     ```
2. In `onSubmit`:
   - Show success toast on successful login:
     ```tsx
     toast.success('Đăng nhập thành công! Đang chuyển hướng...');
     ```
   - Ensure client-side cookies for `userRole` and `userGrade` are set immediately.
   - Handle invalid credentials with prominent error message.

- [ ] **Step 2: Update RegisterForm.tsx**
1. Update `TelegramLoginWidget` prop from `onAuthCallback` to `onAuthSuccess`.

- [ ] **Step 3: Typecheck frontend**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit Task 2**

```bash
git add frontend/src/components/auth/LoginForm.tsx frontend/src/components/auth/RegisterForm.tsx
git commit -m "feat(auth): improve login feedback and handle direct Telegram success"
```

---

### Task 3: Centralize Backend Cookie Setting with Cross-Domain Support

**Files:**
- Modify: `backend/internal/handlers/auth_handler.go`
- Modify: `backend/internal/handlers/auth_telegram.go`

- [ ] **Step 1: Create helper `setAuthCookies` in `auth_handler.go`**
```go
func setAuthCookies(c *gin.Context, accessToken, refreshToken, role, grade string) {
	domain := ""
	secure := false
	host := c.Request.Host
	if strings.Contains(host, "toan6789.vn") || os.Getenv("GIN_MODE") == "release" {
		domain = ".toan6789.vn"
		secure = true
	}
	c.SetCookie("accessToken", accessToken, 24*60*60, "/", domain, secure, true)
	c.SetCookie("refreshToken", refreshToken, 7*24*60*60, "/", domain, secure, true)
	c.SetCookie("userRole", role, 24*60*60, "/", domain, secure, false)
	c.SetCookie("userGrade", grade, 24*60*60, "/", domain, secure, false)
}
```

- [ ] **Step 2: Use `setAuthCookies` in Login, Refresh, and Telegram QR Status endpoints**

Replace repeated `c.SetCookie` in `auth_handler.go` and `auth_telegram.go` with `setAuthCookies`.

- [ ] **Step 3: Verify Go backend build**

Run: `cd backend && go build -o /dev/null ./cmd/api/main.go`
Expected: 0 errors

- [ ] **Step 4: Commit Task 3**

```bash
git add backend/internal/handlers/auth_handler.go backend/internal/handlers/auth_telegram.go
git commit -m "fix(auth): set cross-domain cookies for toan6789.vn"
```

---

### Task 4: Synchronize Client-Side Cookies in `authApi.ts`

**Files:**
- Modify: `frontend/src/lib/authApi.ts`

- [ ] **Step 1: Set client cookies in `login` and `telegramLogin` functions**
```typescript
if (res.user) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(res.user));
    document.cookie = `userRole=${res.user.role}; path=/; max-age=86400; SameSite=Lax`;
    if (res.user.grade) {
      document.cookie = `userGrade=${res.user.grade}; path=/; max-age=86400; SameSite=Lax`;
    }
  }
}
```

- [ ] **Step 2: Typecheck frontend**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit Task 4**

```bash
git add frontend/src/lib/authApi.ts
git commit -m "fix(auth): synchronize client cookies in authApi"
```

---

### Task 5: Testing, Local Verification & Deployment to Dokku VPS

- [ ] **Step 1: Restart local Go backend and test login locally**
- [ ] **Step 2: Deploy updated frontend to Dokku VPS**
  `git push dokku-frontend $(git subtree split --prefix frontend main):refs/heads/main --force`
- [ ] **Step 3: Deploy updated backend to Dokku VPS**
  `git push dokku-backend $(git subtree split --prefix backend main):refs/heads/main --force`
- [ ] **Step 4: Verify production login at `https://toan6789.vn/login` with browser tools**

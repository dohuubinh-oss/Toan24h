# In-App WebRTC Camera & Anti-Cheat Safe Handwriting Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide an In-App WebRTC Camera capture feature on mobile devices during exams so students can photograph handwritten math solutions directly within the page without triggering `visibilitychange` anti-cheat penalties, while preserving QR code scanning for desktop and removing arbitrary local file/gallery uploads.

**Architecture:** 
1. Build `InAppCameraModal` utilizing HTML5 `navigator.mediaDevices.getUserMedia` and `<video>`/`<canvas>` to stream camera feed and capture images entirely in-page.
2. In `EssayQuestion`, detect mobile devices: automatically open `InAppCameraModal` on mobile, while opening `MobileQrUploadModal` on desktop.
3. Fix and update `recognizeHandwriting` to support `Blob` (from `<canvas>.toBlob`) and properly parse `apiFetch` JSON responses.
4. Clean up `mobile-upload/page.tsx` copy to enforce strict live camera capture.

**Tech Stack:** Next.js 16+, React 19, TypeScript, WebRTC (`getUserMedia`), Vitest, Testing Library.

**Spec:** Requirement discussed and agreed in conversation: Option 1 (In-App WebRTC Camera modal, no tab switching, anti-cheat safe).

## Global Constraints

- **No Cross-Project References**: Strictly isolated to `toan6789.vn`.
- **Zero Anti-Cheat Triggers**: Never cause `document.hidden` to become `true` on mobile when taking a photo.
- **Strict TDD**: Write tests before implementation for new units.
- **Clean UI**: Use app design tokens (rounded corners, subtle borders, Lucide icons, glassmorphism/modals).

## Review Focus

1. **Permission Denied / No Camera Found**: Gracefully show error message in modal without crashing or locking the screen.
2. **Camera Resource Cleanup**: Stop all media stream tracks (`track.stop()`) whenever modal closes or unmounts to release hardware.
3. **Desktop vs Mobile Behavior**: Desktop defaults to QR Modal; mobile defaults to In-App Camera modal.
4. **Network Glitch / OCR Failure**: Show friendly error toast and allow student to retry without losing existing editor content.
5. **Toast Context in Tests**: Wrap test components in `<ToastProvider>` to avoid test runtime context errors.

---

### Task 1: Fix and Enhance `recognizeHandwriting` in `frontend/src/lib/api.ts`

**Files:**
- Modify: `frontend/src/lib/api.ts:163-179`
- Create/Modify: `frontend/src/lib/api.test.ts`

**Interfaces:**
- Consumes: `/ocr` backend endpoint
- Produces: `recognizeHandwriting(file: File | Blob): Promise<string>`

- [ ] **Step 1: Write test for `recognizeHandwriting`**
Create/update `frontend/src/lib/api.test.ts` testing that `recognizeHandwriting` sends a Blob/File as form data and extracts `res.text`.

- [ ] **Step 2: Run test to verify failure**
Run: `npx vitest run src/lib/api.test.ts`
Expected: FAIL or type mismatch with Blob.

- [ ] **Step 3: Implement `recognizeHandwriting(file: File | Blob)` in `frontend/src/lib/api.ts`**
Update signature to accept `File | Blob`. Fix `apiFetch` return value: remove redundant `if (!res.ok)` / `res.json()`, and directly return `res.text || ''`.

- [ ] **Step 4: Run test to verify pass**
Run: `npx vitest run src/lib/api.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit changes**
`git add frontend/src/lib/api.ts frontend/src/lib/api.test.ts && git commit -m "fix(api): support Blob and fix json parsing in recognizeHandwriting"`

---

### Task 2: Build `InAppCameraModal` Component

**Files:**
- Create: `frontend/src/components/exam/taking/InAppCameraModal.tsx`
- Create: `frontend/src/components/exam/taking/InAppCameraModal.test.tsx`

**Interfaces:**
- Consumes: `recognizeHandwriting` from `@/lib/api`, `useToast` from `@/components/ui/ToastProvider`
- Produces: `<InAppCameraModal isOpen={boolean} onClose={() => void} onUploadSuccess={(text: string) => void} />`

- [ ] **Step 1: Write unit tests for `InAppCameraModal`**
Test modal render, mock `navigator.mediaDevices.getUserMedia`, simulate capture button clicking, canvas drawing, calling `recognizeHandwriting`, and calling `onUploadSuccess`. Test camera stream stopping on close.

- [ ] **Step 2: Run test to verify failure**
Run: `npx vitest run src/components/exam/taking/InAppCameraModal.test.tsx`
Expected: FAIL (file does not exist).

- [ ] **Step 3: Implement `InAppCameraModal.tsx`**
Features:
- `<video>` element with `autoPlay`, `playsInline`, `muted`.
- State: `stream`, `isCapturing`, `capturedBlob`, `previewUrl`, `isLoading`, `errorMsg`, `facingMode ('environment' | 'user')`.
- Start stream on `isOpen = true`, stop all tracks on `onClose` and cleanup.
- Capture logic: create `<canvas>`, draw current video frame, `canvas.toBlob(blob => ..., 'image/jpeg', 0.85)`.
- Confirm button: invokes `recognizeHandwriting(blob)`, on success calls `onUploadSuccess(text)` and `onClose()`.
- Error UI if `getUserMedia` fails (e.g. Permission denied or NotAllowedError).

- [ ] **Step 4: Run test to verify pass**
Run: `npx vitest run src/components/exam/taking/InAppCameraModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit changes**
`git add frontend/src/components/exam/taking/InAppCameraModal.tsx frontend/src/components/exam/taking/InAppCameraModal.test.tsx && git commit -m "feat(exam): implement InAppCameraModal with WebRTC and OCR"`

---

### Task 3: Integrate Device-Aware Camera & QR Trigger in `EssayQuestion.tsx`

**Files:**
- Modify: `frontend/src/components/exam/taking/EssayQuestion.tsx`
- Modify: `frontend/src/components/exam/taking/EssayQuestion.test.tsx`

**Interfaces:**
- Consumes: `InAppCameraModal`, `MobileQrUploadModal`
- Produces: Seamless switching between QR mode (Desktop) and In-App Camera mode (Mobile).

- [ ] **Step 1: Update `EssayQuestion.test.tsx` with ToastProvider and mobile check**
Wrap `render` in `<ToastProvider>`. Add tests verifying clicking "Chụp bài thi" on mobile triggers the in-app camera modal, and on desktop triggers the QR modal.

- [ ] **Step 2: Run test to verify current state**
Run: `npx vitest run src/components/exam/taking/EssayQuestion.test.tsx`
Expected: Tests fail or verify need for mobile detection.

- [ ] **Step 3: Implement mobile detection and camera trigger in `EssayQuestion.tsx`**
- Add mobile detection helper: check `window.matchMedia('(pointer: coarse)').matches || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)`.
- If mobile: clicking "Chụp bài thi" sets `isInAppCameraOpen = true`.
- If desktop: clicking "Chụp bài thi" opens `MobileQrUploadModal` (with option to switch to In-App Camera).
- Render `<InAppCameraModal>` alongside `<MobileQrUploadModal>`.

- [ ] **Step 4: Run tests to verify pass**
Run: `npx vitest run src/components/exam/taking/EssayQuestion.test.tsx`
Expected: All tests PASS.

- [ ] **Step 5: Commit changes**
`git add frontend/src/components/exam/taking/EssayQuestion.tsx frontend/src/components/exam/taking/EssayQuestion.test.tsx && git commit -m "feat(exam): integrate mobile InAppCameraModal and desktop QR trigger"`

---

### Task 4: Clean up `mobile-upload/page.tsx` Copy & Restrictions

**Files:**
- Modify: `frontend/src/app/(fullscreen)/mobile-upload/page.tsx`

- [ ] **Step 1: Remove gallery selection and enforce camera capture only**
- Remove text `"hoặc chọn ảnh có sẵn từ Thư viện"`.
- Keep label clear: `"Bấm vào đây để mở Máy ảnh chụp bài làm"`.
- Ensure `<input type="file" accept="image/*" capture="environment" />` has strict capture attribute.

- [ ] **Step 2: Commit changes**
`git add frontend/src/app/(fullscreen)/mobile-upload/page.tsx && git commit -m "refactor(mobile-upload): enforce direct camera capture and clean copy"`

---

### Task 5: End-to-End Verification

- [ ] **Step 1: Run complete vitest suite for exam taking components**
Run: `npx vitest run src/components/exam/taking/`
Expected: All targeted tests PASS.

- [ ] **Step 2: Verify build and TypeScript correctness**
Run: `npx tsc --noEmit` in `frontend/`
Expected: 0 errors in modified components.

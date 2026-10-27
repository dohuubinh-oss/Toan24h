# Blog YouTube Shorts Playlist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai định dạng bài viết Blog mới `shorts_playlist` cho toan6789.vn, cho phép đăng tải và xem chuỗi video YouTube Shorts mẹo giải toán kết hợp khung phát 9:16 và sổ tay ghi chú công thức toán học đồng bộ tự động theo Bố cục A (Split Stage Focus).

**Architecture:** Mở rộng mô hình `BlogPost` hỗ trợ `postType: 'shorts_playlist'` và chuỗi JSON `playlistData` chứa mảng `ShortItem[]`. Xây dựng component `ShortsPlaylistStage` chia 2 cột (trái: YouTube embed 9:16 + điều khiển Next/Prev, phải: Sổ tay công thức toán học `MathText` + mini playlist rail). Tích hợp vào trang chi tiết `/blog/[slug]`, trang tạo/sửa `/dashboard/blog/create`, và trang danh sách `/blog`.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide React, MathText (KaTeX / MathJax rendering), Vitest / React Testing Library.

**Spec:** [`docs/superpowers/specs/2026-10-27-blog-shorts-playlist-design.md`](file:///Users/modeptrai/Desktop/toan6789.vn/docs/superpowers/specs/2026-10-27-blog-shorts-playlist-design.md)

## Global Constraints

- **DESIGN.md Compliance:** Tuân thủ triệt để [DESIGN.md](file:///Users/modeptrai/Desktop/toan6789.vn/DESIGN.md): Font `Lexend` cho UI, `Times New Roman` cho công thức toán học, màu chủ đạo Blue 600 (`#2563EB`), thẻ Slate-50 (`#F8FAFC`), viền M3 Outlined siêu nhẹ.
- **No Page Reload on Navigation:** Chuyển đổi giữa các video trong playlist bằng client state, tuyệt đối không reload lại trang.
- **Aspect Ratio Integrity:** Khung video Shorts phải giữ đúng tỉ lệ 9:16 trên mọi kích thước màn hình mà không bị bóp méo.
- **Touch Target Standard:** Nút bấm điều hướng tối thiểu 44x44px.
- **Zero Deployment VPS:** Tuân thủ thiết luật `NO AUTO DEPLOY` trong `GEMINI.md`.

## Review Focus

1. **URL Shorts đa dạng:** Người dùng nhập các dạng link khác nhau (`https://www.youtube.com/shorts/{id}`, `https://youtu.be/{id}`, `https://youtube.com/watch?v={id}`). Hàm parse phải tách chính xác video ID 11 ký tự.
2. **Playlist rỗng hoặc JSON hỏng:** Nếu `playlistData` là chuỗi JSON không hợp lệ hoặc mảng rỗng, giao diện phải có fallback an toàn, không được crash ứng dụng.
3. **Phím tắt bàn phím:** Khi học sinh bấm phím mũi tên `ArrowLeft` / `ArrowRight`, video chuyển đổi nhịp nhàng mà không cản trở việc gõ chữ trong input.
4. **Đồng bộ hóa ghi chú:** Khi chuyển video, nội dung công thức toán học bên cột phải phải lập tức render lại tương ứng với video mới.
5. **Giữ nguyên bài viết thường:** Các bài blog định dạng `standard` cũ vẫn phải hoạt động bình thường 100% không bị ảnh hưởng.

---

### Task 1: Data Model & Helpers for Shorts Playlist

**Files:**
- Modify: `frontend/src/data/blogData.ts`
- Create: `frontend/src/lib/youtubeUtils.ts`
- Test: `frontend/src/lib/youtubeUtils.test.ts`

**Interfaces:**
- Consumes: Nothing
- Produces:
  - `BlogPostType`: `'standard' | 'shorts_playlist'`
  - `ShortItem`: `{ id: string; youtubeUrl: string; videoId: string; title: string; duration?: string; notes: string; }`
  - `extractYouTubeVideoId(url: string): string | null`
  - `parseShortsPlaylist(playlistData?: string): ShortItem[]`

- [ ] **Step 1: Write the failing test for YouTube URL parsing and playlist data parser**

```typescript
// frontend/src/lib/youtubeUtils.test.ts
import { describe, it, expect } from 'vitest'
import { extractYouTubeVideoId, parseShortsPlaylist } from './youtubeUtils'

describe('youtubeUtils', () => {
  it('extracts 11-char videoId from various YouTube Shorts and standard URLs', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s')).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeVideoId('invalid-url')).toBe(null)
  })

  it('safely parses valid and corrupted playlist JSON', () => {
    const validJson = JSON.stringify([
      { id: '1', youtubeUrl: 'https://youtube.com/shorts/abc12345678', videoId: 'abc12345678', title: 'Tip 1', notes: 'Công thức A' }
    ])
    expect(parseShortsPlaylist(validJson)).toHaveLength(1)
    expect(parseShortsPlaylist(validJson)[0].videoId).toBe('abc12345678')
    expect(parseShortsPlaylist('')).toEqual([])
    expect(parseShortsPlaylist('corrupted json')).toEqual([])
    expect(parseShortsPlaylist(undefined)).toEqual([])
  })
})
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/youtubeUtils.test.ts`
Expected: FAIL with "Cannot find module './youtubeUtils'"

- [x] **Step 3: Implement `youtubeUtils.ts` and extend `blogData.ts`**

In `frontend/src/lib/youtubeUtils.ts`:
- Implement `extractYouTubeVideoId(url: string): string | null`: using regex matching `/(?:shorts\/|youtu\.be\/|v=|watch\?v=|^)([a-zA-Z0-9_-]{11})(?:[&?]|$)/`.
- Implement `parseShortsPlaylist(playlistData?: string): ShortItem[]`: safe `JSON.parse` with `Array.isArray` check and empty array fallback.

In `frontend/src/data/blogData.ts`:
- Add `BlogPostType = 'standard' | 'shorts_playlist'`.
- Add `ShortItem` interface.
- Add optional `postType?: BlogPostType` and `playlistData?: string` to `BlogPost`.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/youtubeUtils.test.ts`
Expected: PASS (all 2 tests pass)

- [x] **Step 5: Commit**

```bash
git add frontend/src/lib/youtubeUtils.ts frontend/src/lib/youtubeUtils.test.ts frontend/src/data/blogData.ts
git commit -m "feat(blog): add ShortItem data models and youtube parser helpers"
```

---

### Task 2: Shorts Playlist Viewer Component (`ShortsPlaylistStage`)

**Files:**
- Create: `frontend/src/components/blog/ShortsPlaylistStage.tsx`
- Test: `frontend/src/components/blog/ShortsPlaylistStage.test.tsx`

**Interfaces:**
- Consumes: `ShortItem` from `frontend/src/data/blogData.ts`
- Produces: `ShortsPlaylistStage({ shorts, postTitle, authorName }: ShortsPlaylistStageProps)`

- [x] **Step 1: Write the failing test for `ShortsPlaylistStage`**

```tsx
// frontend/src/components/blog/ShortsPlaylistStage.test.tsx
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ShortsPlaylistStage } from './ShortsPlaylistStage'
import { ShortItem } from '@/data/blogData'

const mockShorts: ShortItem[] = [
  { id: '1', youtubeUrl: 'https://youtube.com/shorts/vid11111111', videoId: 'vid11111111', title: 'Mẹo Tích Phân', notes: 'Công thức tích phân hàm ẩn' },
  { id: '2', youtubeUrl: 'https://youtube.com/shorts/vid22222222', videoId: 'vid22222222', title: 'Mẹo Cực Trị', notes: 'Công thức cực trị bậc 3' }
]

describe('ShortsPlaylistStage', () => {
  it('renders initial video and synchronized notes', () => {
    render(<ShortsPlaylistStage shorts={mockShorts} postTitle="Chuỗi Shorts Casio" authorName="ThS. Nguyễn Văn An" />)
    expect(screen.getByText('Mẹo Tích Phân')).toBeInTheDocument()
    expect(screen.getByText(/Công thức tích phân hàm ẩn/i)).toBeInTheDocument()
    const iframe = screen.getByTitle(/YouTube Shorts Player/i)
    expect(iframe).toHaveAttribute('src', expect.stringContaining('vid11111111'))
  })

  it('navigates to next and previous video updating notes and player', () => {
    render(<ShortsPlaylistStage shorts={mockShorts} postTitle="Chuỗi Shorts Casio" authorName="ThS. Nguyễn Văn An" />)
    const nextBtn = screen.getByRole('button', { name: /Tiếp theo/i })
    fireEvent.click(nextBtn)
    expect(screen.getByText('Mẹo Cực Trị')).toBeInTheDocument()
    expect(screen.getByText(/Công thức cực trị bậc 3/i)).toBeInTheDocument()
    const iframe = screen.getByTitle(/YouTube Shorts Player/i)
    expect(iframe).toHaveAttribute('src', expect.stringContaining('vid22222222'))
  })

  it('selects video directly from thumbnail rail', () => {
    render(<ShortsPlaylistStage shorts={mockShorts} postTitle="Chuỗi Shorts Casio" authorName="ThS. Nguyễn Văn An" />)
    const secondThumb = screen.getByText('Mẹo Cực Trị')
    fireEvent.click(secondThumb)
    expect(screen.getByText(/Công thức cực trị bậc 3/i)).toBeInTheDocument()
  })
})
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/blog/ShortsPlaylistStage.test.tsx`
Expected: FAIL with "Cannot find module './ShortsPlaylistStage'"

- [x] **Step 3: Implement `ShortsPlaylistStage.tsx`**

In `frontend/src/components/blog/ShortsPlaylistStage.tsx`:
- Render 2-column layout (Split Stage Focus - Layout A):
  - Left column: Aspect ratio 9:16 container with `iframe` (`https://www.youtube-nocookie.com/embed/${currentShort.videoId}?autoplay=1&rel=0`), next/prev buttons with `44x44px` touch target.
  - Right column: Card with Modern Academic tokens (`border-slate-200/60`, `bg-white`, `rounded-2xl`, `shadow-sm`), header showing tip number `Tip ${currentIndex + 1}/${shorts.length}`, `MathText` rendering `currentShort.notes`.
  - Bottom: Mini Playlist Rail with thumbnail images (`https://img.youtube.com/vi/${short.videoId}/mqdefault.jpg`) and active outline indicator.
  - Support keyboard listener for `ArrowLeft` and `ArrowRight` when focus is not inside an input.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/blog/ShortsPlaylistStage.test.tsx`
Expected: PASS (all 3 tests pass)

- [x] **Step 5: Commit**

```bash
git add frontend/src/components/blog/ShortsPlaylistStage.tsx frontend/src/components/blog/ShortsPlaylistStage.test.tsx
git commit -m "feat(blog): implement ShortsPlaylistStage component for Layout A"
```

---

### Task 3: Blog Detail Page Integration (`/blog/[slug]`)

**Files:**
- Modify: `frontend/src/app/(main)/blog/[slug]/page.tsx`
- Test: `frontend/src/app/(main)/blog/[slug]/page.test.tsx`

**Interfaces:**
- Consumes: `BlogPost` from `blogData.ts`, `ShortsPlaylistStage` from `ShortsPlaylistStage.tsx`, `parseShortsPlaylist` from `youtubeUtils.ts`.
- Produces: Blog detail page dynamically rendering `ShortsPlaylistStage` when `post.postType === 'shorts_playlist'`.

- [x] **Step 1: Write the failing test for blog detail shorts playlist rendering**

```tsx
// frontend/src/app/(main)/blog/[slug]/page.test.tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BlogDetailPage from './page'
import * as blogData from '@/data/blogData'

vi.mock('@/data/blogData', async () => {
  const actual = await vi.importActual<any>('@/data/blogData')
  return {
    ...actual,
    getBlogPosts: () => [
      {
        id: 'test-shorts',
        slug: 'playlist-casio-15s',
        title: 'Tuyển tập 10 Shorts Casio',
        postType: 'shorts_playlist',
        playlistData: JSON.stringify([
          { id: '1', youtubeUrl: 'https://youtube.com/shorts/vid123', videoId: 'vid123', title: 'Casio Tích Phân', notes: 'Ghi chú số 1' }
        ]),
        category: 'Meo-Casio',
        categoryLabel: 'Mẹo Casio',
        coverImage: 'https://example.com/cover.jpg',
        author: { name: 'Thầy Bình', avatar: 'https://example.com/avt.jpg', role: 'Giáo viên' },
        publishedAt: '27/10/2026',
        readTime: '5 phút',
        tags: ['Casio']
      }
    ]
  }
})

describe('BlogDetailPage with shorts_playlist', () => {
  it('renders ShortsPlaylistStage when postType is shorts_playlist', async () => {
    const params = Promise.resolve({ slug: 'playlist-casio-15s' })
    render(<BlogDetailPage params={params} />)
    expect(await screen.findByText('Casio Tích Phân')).toBeInTheDocument()
    expect(screen.getByText(/Ghi chú số 1/i)).toBeInTheDocument()
  })
})
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/(main)/blog/[slug]/page.test.tsx`
Expected: FAIL (renders standard article body instead of Shorts stage)

- [x] **Step 3: Update `frontend/src/app/(main)/blog/[slug]/page.tsx`**

In `page.tsx`:
- Import `ShortsPlaylistStage` and `parseShortsPlaylist`.
- Check `if (post.postType === 'shorts_playlist')`:
  - Parse `shorts = parseShortsPlaylist(post.playlistData || post.content)`.
  - Render `<ShortsPlaylistStage shorts={shorts} postTitle={post.title} authorName={post.author.name} />` directly under the article header/author bar.
- Else: keep standard `MathText content={post.content}`.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/(main)/blog/[slug]/page.test.tsx`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add frontend/src/app/(main)/blog/[slug]/page.tsx frontend/src/app/(main)/blog/[slug]/page.test.tsx
git commit -m "feat(blog): integrate shorts_playlist rendering into blog detail page"
```

---

### Task 4: Blog Creation & Edit Form Integration (`/dashboard/blog/create`)

**Files:**
- Modify: `frontend/src/app/(fullscreen)/dashboard/blog/create/page.tsx`
- Test: `frontend/src/app/(fullscreen)/dashboard/blog/create/page.test.tsx`

**Interfaces:**
- Consumes: `BlogPostType`, `ShortItem`, `extractYouTubeVideoId`, `ShortsPlaylistStage`
- Produces: Form supporting `postType` toggle, dynamic ShortItem cards (YouTube URL, title, notes editor), preview mode, and JSON serialization.

- [x] **Step 1: Write the failing test for blog create shorts editor**

```tsx
// frontend/src/app/(fullscreen)/dashboard/blog/create/page.test.tsx
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CreateBlogPostPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('CreateBlogPostPage shorts playlist mode', () => {
  it('allows switching post type to Playlist Video Shorts and adding short items', () => {
    render(<CreateBlogPostPage />)
    const shortsRadio = screen.getByLabelText(/Playlist Video Shorts/i)
    fireEvent.click(shortsRadio)

    expect(screen.getByText(/Thêm video Short/i)).toBeInTheDocument()
    const addBtn = screen.getByText(/Thêm video Short/i)
    fireEvent.click(addBtn)

    expect(screen.getAllByPlaceholderText(/Dán link YouTube Short/i).length).toBeGreaterThan(0)
  })
})
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/(fullscreen)/dashboard/blog/create/page.test.tsx`
Expected: FAIL with "Unable to find label Playlist Video Shorts"

- [x] **Step 3: Update `frontend/src/app/(fullscreen)/dashboard/blog/create/page.tsx`**

In `page.tsx`:
- Add state `postType: BlogPostType = 'standard'`.
- Add state `shortsList: ShortItem[] = [{ id: '1', youtubeUrl: '', videoId: '', title: '', notes: '' }]`.
- Add post type selector in header/sidebar: `[ Bài viết chuẩn ]` | `[ 🎬 Playlist Video Shorts ]`.
- When `postType === 'shorts_playlist'`:
  - Show list of short item cards:
    - YouTube URL input with auto-extraction of `videoId` on change/blur.
    - Title input.
    - Notes text editor with LaTeX preview.
    - Buttons: Add item, Remove item, Move up/down.
  - In `handlePublish`: validate at least 1 short with valid `videoId` and title, serialize to `playlistData: JSON.stringify(shortsList)`.
  - In Preview tab: Render `<ShortsPlaylistStage shorts={validShorts} ... />`.
  - In Edit mode: If existing post has `postType === 'shorts_playlist'`, restore `shortsList` from `existing.playlistData`.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/(fullscreen)/dashboard/blog/create/page.test.tsx`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add frontend/src/app/(fullscreen)/dashboard/blog/create/page.tsx frontend/src/app/(fullscreen)/dashboard/blog/create/page.test.tsx
git commit -m "feat(blog): add shorts playlist editor and json serialization in blog creator"
```

---

### Task 5: Blog List Badge & Sample Data (`/blog`)

**Files:**
- Modify: `frontend/src/data/blogData.ts`
- Modify: `frontend/src/app/(main)/blog/page.tsx`
- Test: `frontend/src/app/(main)/blog/page.test.tsx`

**Interfaces:**
- Consumes: `post.postType`, `parseShortsPlaylist`
- Produces: Visual badge `Playlist Shorts` on blog card, verified end-to-end.

- [x] **Step 1: Write the failing test for blog list badge**

```tsx
// frontend/src/app/(main)/blog/page.test.tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import BlogListPage from './page'

describe('BlogListPage with shorts playlist items', () => {
  it('displays playlist shorts badge on shorts posts', () => {
    render(<BlogListPage />)
    const badges = screen.queryAllByText(/Playlist Shorts/i)
    expect(badges.length).toBeGreaterThan(0)
  })
})
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/(main)/blog/page.test.tsx`
Expected: FAIL (no "Playlist Shorts" badge)

- [x] **Step 3: Update `blogData.ts` and `frontend/src/app/(main)/blog/page.tsx`**

In `frontend/src/data/blogData.ts`:
- Add 1 sample blog post with `postType: 'shorts_playlist'` and realistic math shorts data (e.g. "Tuyển tập 5 mẹo bấm máy Casio fx-580VNX tính tích phân và cực trị") so users can immediately test the feature.

In `frontend/src/app/(main)/blog/page.tsx`:
- In the blog card item rendering, check `post.postType === 'shorts_playlist'`:
  - Show a badge `<span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px] flex items-center gap-1"><Play className="w-3 h-3 fill-purple-600" /> Playlist Shorts</span>`.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/(main)/blog/page.test.tsx`
Expected: PASS

- [x] **Step 5: Run full verification loop**

Run: `npx tsc --noEmit` and `npx vitest run` across the new test files.
Expected: Zero type errors, all tests pass.

- [x] **Step 6: Commit**

```bash
git add frontend/src/data/blogData.ts frontend/src/app/(main)/blog/page.tsx frontend/src/app/(main)/blog/page.test.tsx
git commit -m "feat(blog): add playlist badge in blog listing and sample shorts data"
```

# Blog 2-Column Layout & Global Image Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai layout 2 cột trang Blog (Main bên trái 3 card/hàng, Sidebar bên phải chứa Newsletter và Chuyên mục, phân trang 9 bài/trang) và tối ưu hóa hình ảnh, bộ nhớ đệm cache trên toàn codebase.

**Architecture:** Cấu hình Next.js Image Optimizer (`next.config.mjs`) với định dạng AVIF/WebP và 30 ngày cache TTL; thêm Cache-Control header cho static uploads của Backend Go; tái cấu trúc layout trang Blog theo tỷ lệ 9:3 với CSS Grid 3 cột mượt mà và chuyển đổi các thẻ ảnh sang `next/image` có `priority` và `sizes` responsive.

**Tech Stack:** Next.js 16 (App Router), React 19, TailwindCSS v4, Lucide Icons, Go 1.23 / Gin Web Framework.

## Global Constraints
- Layout container trang Blog: `max-w-[1400px]`
- Phân trang trang Blog: `ITEMS_PER_PAGE = 9`
- Lưới bài viết: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6`
- Tối ưu ảnh: `formats: ['image/avif', 'image/webp']` và `Cache-Control: public, max-age=31536000, immutable` cho `/uploads`

---

### Task 1: Cấu hình Next.js Image Optimization

**Files:**
- Modify: `frontend/next.config.mjs:1-15`
- Test: `frontend/tsconfig.json`

**Interfaces:**
- Produces: `images.remotePatterns` và `images.formats` hỗ trợ nén ảnh on-the-fly và remote URLs.

- [ ] **Step 1: Cập nhật `next.config.mjs`**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000, // 30 days
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'api.toan6789.vn' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${process.env.BACKEND_URL || 'https://api.toan6789.vn'}/uploads/:path*`,
      },
    ]
  },
}

export default nextConfig
```

- [ ] **Step 2: Chạy type check để xác minh cấu hình hợp lệ**

Run: `cd frontend && npx tsc --noEmit`
Expected: Output 0 errors.

- [ ] **Step 3: Commit Task 1**

```bash
git add frontend/next.config.mjs
git commit -m "perf(frontend): configure next/image avif/webp formats and remote patterns"
```

---

### Task 2: Cấu hình Cache-Control Header Cho Static Uploads Phía Backend

**Files:**
- Modify: `backend/cmd/server/main.go`

**Interfaces:**
- Produces: Middleware gắn header `Cache-Control: public, max-age=31536000, immutable` cho route `/uploads/*`.

- [ ] **Step 1: Thêm static cache middleware trong Gin backend**

Trong `backend/cmd/server/main.go`, thêm middleware gắn Cache-Control trước khi phục vụ thư mục static:
```go
// Static file serving with cache-control for uploads
r.Use(func(c *gin.Context) {
    if strings.HasPrefix(c.Request.URL.Path, "/uploads/") {
        c.Header("Cache-Control", "public, max-age=31536000, immutable")
    }
    c.Next()
})
r.Static("/uploads", "./uploads")
```

- [ ] **Step 2: Chạy backend test để đảm bảo route không bị lỗi**

Run: `cd backend && go test ./...`
Expected: PASS

- [ ] **Step 3: Commit Task 2**

```bash
git add backend/cmd/server/main.go
git commit -m "perf(backend): add immutable cache-control headers for static uploads"
```

---

### Task 3: Tái Cấu Trúc Layout 2 Cột & Phân Trang 9 Bài/Trang Cho Trang Blog

**Files:**
- Modify: `frontend/src/app/(main)/blog/page.tsx:1-406`

**Interfaces:**
- Consumes: `getBlogPosts()`, `BLOG_CATEGORIES`, `Pagination` component.
- Produces: Giao diện 2 cột (`Main Content` bên trái với lưới 3 card/hàng, `Sidebar` bên phải chứa Newsletter + Danh mục), `ITEMS_PER_PAGE = 9`.

- [ ] **Step 1: Cập nhật state `ITEMS_PER_PAGE = 9` và điều chỉnh container `max-w-[1400px]`**

- [ ] **Step 2: Cập nhật vị trí Grid 2 cột**
  - Cột Trái (`lg:col-span-8 xl:col-span-9`): Chứa Danh sách bài viết (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6`) và component Phân trang (`Pagination`).
  - Cột Phải (`lg:col-span-4 xl:col-span-3`): `sticky top-24`, chứa Newsletter Card và Chuyên mục nổi bật.

- [ ] **Step 3: Thay thế ảnh card sang `next/image`**
  - Dùng `<Image src={post.coverImage} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" loading="lazy" />`
  - Featured article dùng `priority={true}`.

- [ ] **Step 4: Chạy TypeScript check**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit Task 3**

```bash
git add frontend/src/app/\(main\)/blog/page.tsx
git commit -m "feat(blog): update 2-column layout with right sidebar, 3 cards per row, and 9 items pagination"
```

---

### Task 4: Tối Ưu Thẻ Ảnh Cho Chi Tiết Blog & Hero Toàn Trang

**Files:**
- Modify: `frontend/src/app/(main)/blog/[slug]/page.tsx`
- Modify: `frontend/src/components/home/HomeHero.tsx`

**Interfaces:**
- Produces: Ảnh đại diện bài viết chi tiết và avatar trang chủ dùng `next/image` có `priority` và nén tối ưu.

- [ ] **Step 1: Tối ưu ảnh trong `blog/[slug]/page.tsx`**
  - Đổi ảnh cover thành Next.js `<Image priority fill className="object-cover rounded-3xl" />`.
- [ ] **Step 2: Tối ưu avatar trong `HomeHero.tsx`**
  - Đổi avatar học sinh sang `<Image width={40} height={40} className="w-10 h-10 rounded-full border-2 border-white object-cover" />`.
- [ ] **Step 3: Chạy TypeScript check**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit Task 4**

```bash
git add frontend/src/app/\(main\)/blog/\[slug\]/page.tsx frontend/src/components/home/HomeHero.tsx
git commit -m "perf: convert detail and hero images to next/image"
```

---

### Task 5: Kiểm Thử Toàn Diện & Đánh Giá Tốc Độ

**Files:**
- Verify: Toàn bộ hệ thống frontend và backend

- [ ] **Step 1: Chạy toàn bộ test suites**
Run: `cd backend && go test ./... && cd ../frontend && npx tsc --noEmit`
Expected: Tất cả pass.

- [ ] **Step 2: Kiểm tra trực quan trang `/blog`**
Verify: Layout hiển thị đúng 3 card/hàng, Sidebar bên phải, phân trang 9 bài/trang.

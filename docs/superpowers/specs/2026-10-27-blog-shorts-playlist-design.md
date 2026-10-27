# Thiết Kế Chi Tiết: Tính Năng Blog Playlist Video Shorts & Sổ Tay Ghi Chú Toán Học

- **Ngày tạo**: 2026-10-27
- **Trạng thái**: Chờ phê duyệt (Pending Review)
- **Mục tiêu**: Bổ sung định dạng bài viết mới `shorts_playlist` cho hệ thống Blog toan6789.vn, cho phép đăng tải các chuỗi video YouTube Shorts về mẹo/tip giải nhanh Toán học, kết hợp khung xem video dọc 9:16 và cột Sổ tay công thức đồng bộ tự động (theo Bố cục A - Split Stage Focus), tuân thủ tiêu chuẩn [DESIGN.md](file:///Users/modeptrai/Desktop/toan6789.vn/DESIGN.md).

---

## 1. Bối Cảnh & Mục Đích (Intent & The Why)

- **Bài toán thực tế**: Học sinh hiện đại tiếp thu rất nhanh qua định dạng video ngắn (YouTube Shorts, Reels, TikTok) với các tip bấm máy tính Casio 15 giây, công thức tính nhanh cực trị, hình học không gian. Tuy nhiên, nếu chỉ xem trên YouTube thì học sinh dễ quên công thức và thiếu phần ghi chú tóm tắt bài bản.
- **Giải pháp**: Tạo trang Blog chuyên biệt cho Playlist Shorts kết hợp 2 trong 1:
  1. Trải nghiệm xem video dọc 9:16 liền mạch, chuyển đổi video mượt mà giữa các tập.
  2. Sổ tay ghi chú bên cạnh đồng bộ tức thì theo từng video: hiển thị công thức LaTeX, các bước bấm máy Casio và lưu ý mẹo thi.
  3. Dữ liệu playlist được lưu dưới dạng chuỗi JSON có cấu trúc (tương tự cơ chế `examples` của bài giảng và câu hỏi).

---

## 2. Mục Tiêu, Giới Hạn & Nguyên Tắc (Goals, Non-Goals, Anti-Goals)

### 2.1. Mục Tiêu (Goals)
1. **Dữ liệu cấu trúc JSON**: Mỗi bài viết loại playlist chứa một mảng JSON các `ShortItem` (gồm ID, link YouTube, video ID, tiêu đề, thời lượng, nội dung ghi chú HTML/LaTeX).
2. **Giao diện người học (Viewer UI - Bố cục A)**:
   - Cột trái: Khung phát YouTube Shorts dọc tỉ lệ chuẩn 9:16, kèm thanh điều khiển "← Video trước" và "Tiếp theo →".
   - Cột phải: Khung Ghi chú bài học hiển thị công thức toán học sắc nét, các bước bấm máy Casio, nút "Luyện tập bài tương tự".
   - Bên dưới: Thanh playlist thu nhỏ (mini rail) thể hiện danh sách toàn bộ các Shorts trong chuyên đề.
   - Chuyển video không tải lại trang (Single Page Navigation mượt mà).
3. **Giao diện tác giả/quản trị (Authoring UI)**:
   - Trên trang [`/dashboard/blog/create`](file:///Users/modeptrai/Desktop/toan6789.vn/frontend/src/app/\(fullscreen\)/dashboard/blog/create/page.tsx), thêm công tắc chọn loại bài viết: `Bài viết thường` hoặc `Playlist Video Shorts`.
   - Khi chọn Playlist Shorts, hiển thị danh sách các thẻ video: nhập link YouTube (tự tách video ID), tiêu đề, và trình soạn thảo ghi chú công thức cho từng video.
   - Có thể thêm, xóa, sắp xếp lại thứ tự video. Hỗ trợ xem trước (Preview) y hệt trang thực tế.
4. **Huy hiệu nhận diện trên trang Blog**: Trên danh sách [`/blog`](file:///Users/modeptrai/Desktop/toan6789.vn/frontend/src/app/\(main\)/blog/page.tsx), các bài viết dạng Shorts Playlist có badge `Playlist Shorts` và icon video nổi bật.
5. **Tiêu chuẩn thiết kế [DESIGN.md](file:///Users/modeptrai/Desktop/toan6789.vn/DESIGN.md)**: Font `Lexend` cho giao diện, `Times New Roman` cho công thức toán học, màu chủ đạo Blue 600 (`#2563EB`), thẻ Slate-50 (`#F8FAFC`), viền M3 Outlined siêu nhẹ.

### 2.2. Không Thuộc Phạm Vi (Non-Goals)
- Không lưu trữ/upload trực tiếp file video nặng (MP4) lên server, chỉ nhúng player iframe từ YouTube Shorts.
- Không xây dựng thuật toán tự động đề xuất video của YouTube (playlist hoàn toàn do giáo viên/admin chỉ định).

### 2.3. Chống Mục Tiêu (Anti-Goals)
- Tuyệt đối không reload trang khi học sinh bấm chuyển video trong playlist.
- Không để video player bị méo hoặc vỡ tỉ lệ 9:16 khi co giãn màn hình (desktop vs mobile).

---

## 3. Thiết Kế Dữ Liệu (Data Model)

Mở rộng cấu trúc `BlogPost` trong [`frontend/src/data/blogData.ts`](file:///Users/modeptrai/Desktop/toan6789.vn/frontend/src/data/blogData.ts):

```typescript
export type BlogPostType = 'standard' | 'shorts_playlist';

export interface ShortItem {
  id: string;               // UUID ngẫu nhiên hoặc timestamp
  youtubeUrl: string;       // URL gốc do người dùng nhập (youtube.com/shorts/... hoặc youtu.be/...)
  videoId: string;          // Mã video 11 ký tự trích xuất từ URL
  title: string;            // Tiêu đề ngắn cho mẹo/tip này
  duration?: string;        // Thời lượng hiển thị (VD: "0:55")
  notes: string;            // Nội dung ghi chú, công thức toán học (HTML/LaTeX)
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  content: string;          // Với bài thường: HTML bài viết. Với playlist: JSON string của ShortItem[] hoặc phần giới thiệu chung
  postType?: BlogPostType;  // 'standard' | 'shorts_playlist' (mặc định 'standard')
  playlistData?: string;    // Chuỗi JSON lưu trữ mảng ShortItem[]
  category: BlogCategoryType;
  categoryLabel: string;
  coverImage: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  publishedAt: string;
  readTime: string;
  featured?: boolean;
  tags: string[];
}
```

---

## 4. Thiết Kế Chi Tiết Các Màn Hình

### 4.1. Trang Xem Chi Tiết (`/blog/[slug]`)
- Khi `post.postType === 'shorts_playlist'`:
  - Phân tích chuỗi `playlistData` (hoặc `content`) thành mảng `ShortItem[]`.
  - Quản lý state `currentShortIndex: number` (mặc định = 0).
  - **Khung Shorts bên trái (Width 360px hoặc 40% trên desktop)**:
    - Iframe YouTube Shorts dạng `https://www.youtube.com/embed/{videoId}?autoplay=1&rel=0`.
    - Thanh điều khiển nổi gồm nút `← Video trước` và `Tiếp theo →`.
    - Phím tắt bàn phím: bấm phím mũi tên `←` / `→` để lướt video tiếp theo.
  - **Khung Sổ tay bên phải (Phần còn lại)**:
    - Header: Tiêu đề video hiện tại, số thứ tự (VD: "Tip 02/08"), tác giả.
    - Body: Khung hiển thị `MathText` render công thức LaTeX và các bước giải nhanh.
    - Footer: Nút sao chép công thức & nút luyện tập bài toán tương tự.
  - **Mini Playlist Rail bên dưới**:
    - Hiển thị danh sách card cuộn ngang với thumbnail của từng video (từ `https://img.youtube.com/vi/{videoId}/hqdefault.jpg`).
    - Bấm vào card nào thì `currentShortIndex` đổi sang video đó ngay lập tức.
  - Trên màn hình di động (`< 768px`): Xếp dọc tự nhiên, video 9:16 ở trên cùng, thanh điều khiển dính liền và khung ghi chú cuộn bên dưới.

### 4.2. Trang Tạo & Chỉnh Sửa Blog (`/dashboard/blog/create`)
- Bổ sung trường chọn **Loại bài viết**:
  - `[ Bài viết chuẩn ]` | `[ 🎬 Playlist Video Shorts ]`.
- Khi chọn `Playlist Video Shorts`:
  - Thay vì 1 editor bài viết đơn lẻ, hiển thị danh sách các thẻ video:
    - Input URL YouTube Short: Tự động trích xuất `videoId` và hiển thị ảnh bìa thumbnail kiểm tra ngay.
    - Input Tiêu đề video mẹo.
    - Trình soạn thảo ghi chú (tích hợp `SharedEditorCard` hoặc Markdown/Math text).
    - Các nút: `Thêm video Short`, `Xóa`, `Di chuyển lên/xuống`.
  - Tab **Xem trước (Preview)**: Render trực tiếp Bố cục A tương tác để người biên tập kiểm tra trải nghiệm trước khi xuất bản.
  - Khi bấm Xuất bản: Dữ liệu được serialize thành JSON và lưu vào `playlistData`.

### 4.3. Trang Danh Sách Blog (`/blog`)
- Thẻ card bài viết loại `shorts_playlist` sẽ có huy hiệu:
  - Badge `Playlist Shorts` màu tím hoặc xanh ngọc cùng biểu tượng video.
  - Thời lượng hoặc số lượng video (VD: `5 Video Shorts • Mẹo thi`).

---

## 5. Kế Hoạch Kiểm Thử & Tiêu Chí Nghiệm Thu (Acceptance Criteria)

1. **Hiển thị đúng 9:16**: Khung video shorts không bị vỡ giao diện trên mọi độ phân giải (Mobile 375px đến Desktop 1920px).
2. **Chuyển video mượt mà**: Chuyển đổi giữa các video trong playlist cập nhật cả iframe YouTube lẫn nội dung ghi chú công thức toán học tương ứng mà không tải lại trang.
3. **Đăng bài & Lưu trữ JSON chuẩn**: Trang tạo blog cho phép thêm nhiều video short, lưu thành công vào JSON, và chỉnh sửa lại nguyên vẹn khi mở ở chế độ edit.
4. **Chuẩn thẩm mỹ**: Tuân thủ triệt để [DESIGN.md](file:///Users/modeptrai/Desktop/toan6789.vn/DESIGN.md), không lỗi lint, không lỗi TypeScript (`tsc --noEmit`).

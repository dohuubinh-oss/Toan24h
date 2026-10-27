export type BlogCategoryType = 
  | 'Bi-Quyet-Thi' 
  | 'Tin-Tuc' 
  | 'Toan-6' 
  | 'Toan-7' 
  | 'Toan-8' 
  | 'Toan-9' 
  | 'Meo-Casio'

export type BlogPostType = 'standard' | 'shorts_playlist'

export interface ShortItem {
  id: string
  youtubeUrl: string
  videoId?: string
  imageUrl?: string
  mediaType?: 'video' | 'image'
  title: string
  duration?: string
  notes: string // Ghi chú công thức toán học và mẹo bấm máy
}

export interface BlogPost {
  id: string
  slug: string
  title: string
  summary?: string
  content: string
  postType?: BlogPostType
  playlistData?: string // JSON string của ShortItem[]
  category: BlogCategoryType
  categoryLabel: string
  coverImage: string
  author: {
    name: string
    avatar: string
    role: string
  }
  publishedAt: string
  readTime: string
  featured?: boolean
  tags: string[]
}

export const BLOG_CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'Tất cả bài viết' },
  { id: 'Bi-Quyet-Thi', label: 'Bí quyết thi THPT' },
  { id: 'Tin-Tuc', label: 'Tin tức & Sự kiện' },
  { id: 'Toan-6', label: 'Toán lớp 6' },
  { id: 'Toan-7', label: 'Toán lớp 7' },
  { id: 'Toan-8', label: 'Toán lớp 8' },
  { id: 'Toan-9', label: 'Toán lớp 9' },
  { id: 'Meo-Casio', label: 'Mẹo Casio' },
]

export const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: '5-phuong-phap-giai-nhanh-toan-tich-phan-bang-casio',
    title: '5 Phương pháp giải nhanh Tích phân bằng máy tính CASIO fx-580VN X',
    content: `Tích phân là một trong những phần kiến thức trọng tâm và chiếm tỉ lệ điểm số cao trong đề thi THPT Quốc gia môn Toán. Việc kết hợp giữa tư duy toán học tự luận và kỹ năng sử dụng máy tính bỏ túi CASIO fx-580VN X sẽ giúp học sinh tối ưu hóa thời gian làm bài.

### 1. Kỹ thuật tính Tích phân hàm ẩn bằng phép thế số thực

Đối với các bài toán cho phương trình hàm như:
\\[ \\int_{0}^{1} f(x) dx = 5 \\]
và yêu cầu tính tích phân biến đổi:
\\[ I = \\int_{0}^{\\frac{\\pi}{2}} f(\\sin x) \\cdot \\cos x \\, dx \\]

Ta có thể áp dụng phương pháp đổi biến số đơn giản:
Đặt \\( t = \\sin x \\Rightarrow dt = \\cos x \\, dx \\). 
Khi \\( x = 0 \\Rightarrow t = 0 \\), khi \\( x = \\frac{\\pi}{2} \\Rightarrow t = 1 \\).

Do đó:
\\[ I = \\int_{0}^{1} f(t) dt = 5 \\]

### 2. Sử dụng tính năng SOLVE tìm tiệm cận và điểm cực trị

Khi gặp các bài toán liên quan đến thể tích khối tròn xoay quanh trục \\(Ox\\):
\\[ V = \\pi \\int_{a}^{b} [f(x)]^2 dx \\]

Học sinh có thể nhập trực tiếp biểu thức vào máy tính CASIO và bấm tích phân xác định trong chế độ Radian.

### 3. Lời khuyên từ thầy cô Toan24h

- **Luôn chuyển máy tính về đơn vị Radian (Shift + Menu + 2 + 2)** trước khi tính các bài toán tích phân lượng giác.
- Kiểm tra lại các khoảng xác định của hàm số để tránh bấm máy sai miền xác định.
- Kết hợp công cụ **Chấm điểm AI Toan24h** để tự kiểm tra bước giải chi tiết và phát hiện lỗi sai trong bài thi thử.`,
    category: 'Bi-Quyet-Thi',
    categoryLabel: 'Bí quyết thi THPT',
    coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1200',
    author: {
      name: 'ThS. Nguyễn Văn An',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      role: 'Chuyên gia Chuyên môn Toán Toan24h'
    },
    publishedAt: '12 Tháng 9, 2026',
    readTime: '6 phút đọc',
    featured: true,
    tags: ['Tích phân', 'CASIO', 'Ôn thi THPT', 'Mẹo giải nhanh']
  },
  {
    id: 'shorts-casio-580vnx',
    slug: 'tuyen-tap-shorts-meo-casio-fx-580vnx-giai-nhanh',
    title: 'Tuyển tập Video Shorts: Mẹo bấm máy tính Casio fx-580VNX giải nhanh Toán 9 & THPT',
    summary: 'Chuỗi video ngắn 60s tổng hợp thủ thuật Casio bấm máy tìm nghiệm, cực trị và hệ phương trình siêu tốc kèm bảng công thức tóm tắt.',
    content: 'Tuyển tập các video Short hướng dẫn bấm máy tính Casio fx-580VNX giải nhanh các bài toán trọng tâm.',
    postType: 'shorts_playlist',
    playlistData: JSON.stringify([
      {
        id: 'short-1',
        youtubeUrl: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
        videoId: 'dQw4w9WgXcQ',
        title: 'Mẹo 1: Bấm máy tìm cực trị hàm bậc 3 trong 5 giây',
        duration: '0:45',
        notes: `### Mẹo bấm máy tính tìm cực trị hàm bậc ba
Cho hàm số bậc ba:
$$y = ax^3 + bx^2 + cx + d \\quad (a \\neq 0)$$

**Các bước thao tác trên Casio fx-580VNX:**
1. Bấm **MENU** $\\rightarrow$ **9** (Phương trình/Hệ PT) $\\rightarrow$ **2** (Phương trình) $\\rightarrow$ **3** (Bậc 3).
2. Nhập lần lượt các hệ số $a, b, c, d$.
3. Bấm **=** liên tiếp bỏ qua các nghiệm $x_1, x_2, x_3$.
4. Màn hình hiện:
   - **Cực đại của hàm số:** Giá trị $x_{CĐ}$ và $y_{CĐ}$.
   - **Cực tiểu của hàm số:** Giá trị $x_{CT}$ và $y_{CT}$.`
      },
      {
        id: 'short-2',
        youtubeUrl: 'https://www.youtube.com/shorts/jNQXAC9IVRw',
        videoId: 'jNQXAC9IVRw',
        title: 'Mẹo 2: Giải hệ phương trình bậc nhất hai ẩn & kiểm tra nghiệm vô số',
        duration: '0:52',
        notes: `### Giải hệ phương trình bậc nhất 2 ẩn
Hệ phương trình:
$$\\begin{cases} a_1 x + b_1 y = c_1 \\\\ a_2 x + b_2 y = c_2 \\end{cases}$$

**Thao tác máy tính:**
- Bấm **MENU** $\\rightarrow$ **9** $\\rightarrow$ **1** (Hệ phương trình) $\\rightarrow$ **2** (Số ẩn là 2).
- Nhập $a_1, b_1, c_1$ và $a_2, b_2, c_2$.
- Nếu màn hình báo:
  - **Vô nghiệm (No Solution)**: $\\frac{a_1}{a_2} = \\frac{b_1}{b_2} \\neq \\frac{c_1}{c_2}$.
  - **Vô số nghiệm (Infinite Solutions)**: $\\frac{a_1}{a_2} = \\frac{b_1}{b_2} = \\frac{c_1}{c_2}$.`
      },
      {
        id: 'short-3',
        youtubeUrl: 'https://www.youtube.com/shorts/kJQP7kiw5Fk',
        videoId: 'kJQP7kiw5Fk',
        title: 'Mẹo 3: Tìm nhanh BCNN và ƯCLN phân tích thừa số nguyên tố',
        duration: '0:38',
        notes: `### Phân tích ra thừa số nguyên tố (FACT)
Ví dụ phân tích số $1260$:
1. Gõ $1260$ $\\rightarrow$ bấm **=**.
2. Bấm tổ hợp phím: **SHIFT** + **FACT** (phím dấu độ phút giây $\\circ'''$).
3. Kết quả: $1260 = 2^2 \\times 3^2 \\times 5 \\times 7$.

**Tính ƯCLN (GCD) và BCNN (LCM):**
- **ƯCLN**: Bấm **ALPHA** + **(x)** ($GCD$) $\\rightarrow$ nhập $a$ $\\rightarrow$ bấm **SHIFT** + **)** (dấu phẩy) $\\rightarrow$ nhập $b$ $\\rightarrow$ **)** $\\rightarrow$ **=**.
- **BCNN**: Bấm **ALPHA** + **(÷)** ($LCM$).`
      }
    ]),
    category: 'Meo-Casio',
    categoryLabel: 'Mẹo Casio',
    coverImage: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    author: {
      name: 'ThS. Nguyễn Văn An',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      role: 'Chuyên gia Mẹo Casio Toan6789'
    },
    publishedAt: '27 Tháng 10, 2026',
    readTime: '3 Shorts',
    featured: false,
    tags: ['Casio fx-580VNX', 'Mẹo giải nhanh', 'Shorts', 'Toán 9']
  },
  {
    id: '2',
    slug: 'ung-dung-ai-cham-diem-tu-luan-toan-hoc-dot-pha',
    title: 'Cách trợ lý AI Toan24h phân tích mạch suy luận và chấm bài tự luận chuẩn xác',
    content: `Chấm điểm bài tập tự luận môn Toán luôn là một bài toán hóc chuẩn mực đòi hỏi sự tỉ mỉ. AI Toan24h sử dụng mô hình học sâu kết hợp nhận dạng LaTeX để phân tích từng bước giải của học sinh.

### Phân tích mạch suy luận Toán học theo chuẩn Bộ Giáo Dục

Khi học sinh tải lên bài làm tự luận bằng hình ảnh hoặc gõ công thức trực tiếp, hệ thống AI sẽ thực hiện các bước:

1. **Trích xuất công thức (OCR Math):** Chuyển đổi hình ảnh bài làm thành chuỗi LaTeX chuẩn.
2. **Khớp phương án giải:** So sánh từng bước biến đổi với cây lời giải (Solution Graph).
3. **Phát hiện vị trí sai (Error Localization):** Đánh dấu chính xác vị trí dòng biến đổi bị sai logic kèm giải thích lý do trừ điểm.

Ví dụ đối với phương trình bậc hai:
\\[ ax^2 + bx + c = 0 \\quad (a \\neq 0) \\]
Biệt số \\( \\Delta = b^2 - 4ac \\). Nếu \\( \\Delta < 0 \\), phương trình vô nghiệm trên tập số thực \\(\\mathbb{R}\\).

### Trải nghiệm chấm điểm cá nhân hóa

Nhờ tính năng **"Xem Nhận xét"**, học sinh có thể theo dõi đánh giá tư duy tổng quan và nhận gợi ý thông minh (AI Hint) khi gặp bài toán khó mà không làm mất đi tính độc lập tư duy.`,
    category: 'Meo-Casio',
    categoryLabel: 'Mẹo Casio',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200',
    author: {
      name: 'Dr. Lê Hoàng Nam',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      role: 'Kiến trúc sư Trí tuệ Nhân tạo'
    },
    publishedAt: '10 Tháng 9, 2026',
    readTime: '5 phút đọc',
    featured: false,
    tags: ['AI Grader', 'Công nghệ Giáo dục', 'Chấm tự luận', 'Toan6789']
  },
  {
    id: '3',
    slug: 'nam-vung-hinh-hoc-khong-gian-lop-12-voi-so-do-tu-duy',
    title: 'Nắm vững Hình học Không gian Lớp 9 và Lớp 8 với Sơ đồ Tư duy & Hình chiếu 3D',
    content: `Hình học không gian thường là "nỗi sợ" của nhiều học sinh do yêu cầu khả năng tưởng tượng hình học cao. Tuy nhiên, nếu nắm vững các mô hình gốc, bạn có thể dễ dàng giải quyết 90% các dạng bài trong đề thi.

### 1. Công thức Thể tích Khối Chóp và Khối Lăng Trụ

Thể tích khối chóp có diện tích đáy \\(B\\) và chiều cao \\(h\\):
\\[ V = \\frac{1}{3} B \\cdot h \\]

Thể tích khối lăng trụ:
\\[ V = B \\cdot h \\]

### 2. Khoảng cách từ một điểm đến mặt phẳng

Khoảng cách từ điểm \\(M(x_0, y_0, z_0)\\) đến mặt phẳng \\((P): Ax + By + Cz + D = 0\\):
\\[ d(M, (P)) = \\frac{|Ax_0 + By_0 + Cz_0 + D|}{\\sqrt{A^2 + B^2 + C^2}} \\]

### Bí quyết dựng hình trên Toan6789

Học sinh có thể xem hình minh họa 3D tương tác ngay tại phần **Bài giảng lý thuyết theo khối lớp** trên Toan6789 để hình dung trực quan góc giữa đường thẳng và mặt phẳng.`,
    category: 'Toan-8',
    categoryLabel: 'Toán lớp 8',
    coverImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=1200',
    author: {
      name: 'Cô Trần Minh Anh',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
      role: 'Giảng viên Hình học'
    },
    publishedAt: '08 Tháng 9, 2026',
    readTime: '8 phút đọc',
    featured: false,
    tags: ['Hình học 8', 'Hình học 9', 'Thể tích khối chóp', 'Hình không gian']
  },
  {
    id: '4',
    slug: 'chien-thuat-phan-bo-thoi-gian-lam-bai-thi-toan-thpt',
    title: 'Chiến thuật phân bố thời gian 90 phút làm bài thi Toán THPT hiệu quả nhất',
    content: `Với 50 câu hỏi trắc nghiệm trong thời gian 90 phút, trung bình học sinh chỉ có **1.8 phút** cho mỗi câu. Việc phân bổ thời gian hợp lý chính là chìa khóa để đạt điểm số tối đa.

### Quy tắc 3 Vòng Làm Bài Siêu Tốc

1. **Vòng 1 (0 - 25 phút):** Giải quyết 30 câu hỏi nhận biết, thông hiểu (mục tiêu 6 điểm). Làm đến đâu tô chắc đáp án đến đó.
2. **Vòng 2 (25 - 60 phút):** Tập trung vào 12 câu vận dụng (câu 31 đến 42). Sử dụng máy tính CASIO và các mẹo tính nhanh.
3. **Vòng 3 (60 - 85 phút):** Đăng ký chinh phục 8 câu vận dụng cao (câu 43 đến 50).
4. **5 phút cuối:** Kiểm tra lại phiếu trả lời trắc nghiệm, đảm bảo không bỏ trống câu nào.`,
    category: 'Bi-Quyet-Thi',
    categoryLabel: 'Bí quyết thi THPT',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1200',
    author: {
      name: 'ThS. Nguyễn Văn An',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      role: 'Chuyên gia Chuyên môn Toán Toan24h'
    },
    publishedAt: '05 Tháng 9, 2026',
    readTime: '4 phút đọc',
    featured: false,
    tags: ['Kỹ năng thi', 'Phân bổ thời gian', 'Thi THPT', 'Kinh nghiệm']
  },
  {
    id: '5',
    slug: 'toan24h-ra-mat-tinh-nang-cham-nhan-xet-ai-moi',
    title: 'Toan24h cập nhật giao diện Chấm điểm & Nhận xét AI mượt mà chuẩn Modern Academic',
    content: `Toan24h vừa chính thức phát hành bản cập nhật giao diện mới theo chuẩn thiết kế **Modern Academic (Google Material Inspired)**.

### Những tính năng nổi bật trong bản cập nhật:

- **Giao diện Light Mode thanh lịch:** Tone màu Slate-50 và Blue 600 mang lại cảm giác dễ chịu khi học tập lâu dài.
- **Nút ✨ Xem Nhận xét AI:** Hiển thị popup nhận xét tư duy và chi tiết tự luận mượt mà không làm vỡ bố cục.
- **Bôi vàng lỗi sai thông minh:** Đánh dấu chính xác vị trí sai sót trên bài làm tự luận mà không làm mất đi các định dạng LaTeX hay thẻ HTML.
- **Ghi nhận Điểm Tối Đa:** Hiển thị rõ ràng điểm số đạt được trên thang điểm tối đa (ví dụ: \\(1.5 / 4.0\\)) giúp học sinh dễ dàng theo dõi mục tiêu học tập.`,
    category: 'Tin-Tuc',
    categoryLabel: 'Tin tức & Sự kiện',
    coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200',
    author: {
      name: 'Ban Biên Tập Toan24h',
      avatar: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=200',
      role: 'Đội ngũ Phát triển Sản phẩm'
    },
    publishedAt: '01 Tháng 9, 2026',
    readTime: '3 phút đọc',
    featured: false,
    tags: ['Cập nhật', 'Toan24h', 'Giao diện mới', 'AI Grader']
  }
]

const LOCAL_STORAGE_KEY = 'toan24h_custom_blog_posts'

export function getBlogPosts(): BlogPost[] {
  if (typeof window === 'undefined') {
    return BLOG_POSTS
  }
  try {
    const customPostsStr = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (customPostsStr) {
      const customPosts: BlogPost[] = JSON.parse(customPostsStr)
      // Merge custom posts at the top of default list
      return [...customPosts, ...BLOG_POSTS]
    }
  } catch (e) {
    console.error('Error reading custom blog posts from localStorage', e)
  }
  return BLOG_POSTS
}

export function addBlogPost(post: BlogPost): BlogPost {
  if (typeof window !== 'undefined') {
    try {
      const customPostsStr = localStorage.getItem(LOCAL_STORAGE_KEY)
      let existing: BlogPost[] = customPostsStr ? JSON.parse(customPostsStr) : []
      
      if (post.featured) {
        // Unmark all existing default posts
        BLOG_POSTS.forEach(p => { p.featured = false })
        // Unmark all existing custom posts
        existing.forEach(p => { p.featured = false })
      }

      // Check if post already exists (update mode)
      const existingIdx = existing.findIndex(p => p.id === post.id || p.slug === post.slug)
      if (existingIdx >= 0) {
        existing[existingIdx] = post
      } else {
        existing = [post, ...existing]
      }
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing))
    } catch (e) {
      console.error('Error saving blog post to localStorage', e)
    }
  }
  return post
}

export function updateBlogPost(post: BlogPost): BlogPost {
  return addBlogPost(post)
}

export function getBlogPostByIdOrSlug(idOrSlug: string): BlogPost | undefined {
  const allPosts = getBlogPosts()
  return allPosts.find(p => p.id === idOrSlug || p.slug === idOrSlug)
}


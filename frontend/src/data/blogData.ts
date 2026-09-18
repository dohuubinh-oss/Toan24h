export interface BlogPost {
  id: string
  slug: string
  title: string
  summary?: string
  content: string
  category: 'Bi-Quyet-Thi' | 'Toan-10-12' | 'Meo-AI' | 'Tin-Tuc'
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

export const BLOG_CATEGORIES = [
  { id: 'all', label: 'Tất cả bài viết' },
  { id: 'Bi-Quyet-Thi', label: 'Bí quyết thi THPT' },
  { id: 'Toan-10-12', label: 'Toán Lớp 10 - 12' },
  { id: 'Meo-AI', label: 'Mẹo AI & Công nghệ' },
  { id: 'Tin-Tuc', label: 'Tin tức & Sự kiện' },
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
    category: 'Meo-AI',
    categoryLabel: 'Mẹo AI & Công nghệ',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200',
    author: {
      name: 'Dr. Lê Hoàng Nam',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      role: 'Kiến trúc sư Trí tuệ Nhân tạo'
    },
    publishedAt: '10 Tháng 9, 2026',
    readTime: '5 phút đọc',
    featured: false,
    tags: ['AI Grader', 'Công nghệ Giáo dục', 'Chấm tự luận', 'Toan24h']
  },
  {
    id: '3',
    slug: 'nam-vung-hinh-hoc-khong-gian-lop-12-voi-so-do-tu-duy',
    title: 'Nắm vững Hình học Không gian Lớp 12 với Sơ đồ Tư duy & Hình chiếu 3D',
    content: `Hình học không gian thường là "nỗi sợ" của nhiều học sinh do yêu cầu khả năng tưởng tượng hình học cao. Tuy nhiên, nếu nắm vững các mô hình gốc, bạn có thể dễ dàng giải quyết 90% các dạng bài trong đề thi.

### 1. Công thức Thể tích Khối Chóp và Khối Lăng Trụ

Thể tích khối chóp có diện tích đáy \\(B\\) và chiều cao \\(h\\):
\\[ V = \\frac{1}{3} B \\cdot h \\]

Thể tích khối lăng trụ:
\\[ V = B \\cdot h \\]

### 2. Khoảng cách từ một điểm đến mặt phẳng

Khoảng cách từ điểm \\(M(x_0, y_0, z_0)\\) đến mặt phẳng \\((P): Ax + By + Cz + D = 0\\):
\\[ d(M, (P)) = \\frac{|Ax_0 + By_0 + Cz_0 + D|}{\\sqrt{A^2 + B^2 + C^2}} \\]

### Bí quyết dựng hình trên Toan24h

Học sinh có thể xem hình minh họa 3D tương tác ngay tại phần **Bài giảng lý thuyết theo khối lớp** trên Toan24h để hình dung trực quan góc giữa đường thẳng và mặt phẳng.`,
    category: 'Toan-10-12',
    categoryLabel: 'Toán Lớp 10 - 12',
    coverImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=1200',
    author: {
      name: 'Cô Trần Minh Anh',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
      role: 'Giảng viên Hình học Không gian'
    },
    publishedAt: '08 Tháng 9, 2026',
    readTime: '8 phút đọc',
    featured: false,
    tags: ['Hình học 12', 'Thể tích khối chóp', 'Oxyz', 'Hình không gian']
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
      const existing: BlogPost[] = customPostsStr ? JSON.parse(customPostsStr) : []
      
      if (post.featured) {
        // Unmark all existing default posts
        BLOG_POSTS.forEach(p => { p.featured = false })
        // Unmark all existing custom posts
        existing.forEach(p => { p.featured = false })
      }

      const updated = [post, ...existing]
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
    } catch (e) {
      console.error('Error saving blog post to localStorage', e)
    }
  }
  return post
}


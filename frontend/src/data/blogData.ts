export type BlogCategoryType = 
  | 'Bi-Quyet-Thi' 
  | 'Tin-Tuc' 
  | 'Meo-Casio'
  | 'Meo-Tinh-Nhanh'
  | 'Giai-Toan-Dung-Hinh'
  | 'Toan-6' 
  | 'Toan-7' 
  | 'Toan-8' 
  | 'Toan-9'

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
  { id: 'Bi-Quyet-Thi', label: 'Bí quyết thi vào 10' },
  { id: 'Tin-Tuc', label: 'Tin tức & Sự kiện' },
  { id: 'Meo-Casio', label: 'Mẹo Casio' },
  { id: 'Meo-Tinh-Nhanh', label: 'Mẹo tính nhanh' },
  { id: 'Giai-Toan-Dung-Hinh', label: 'Giải toán dùng hình' },
]

export const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: '5-meo-bam-may-casio-giai-nhanh-toan-9-thi-vao-10',
    title: '5 Mẹo bấm máy tính CASIO fx-580VN X giải nhanh Toán 9 ôn thi vào 10',
    content: `Kỳ thi tuyển sinh vào lớp 10 môn Toán đòi hỏi học sinh không chỉ nắm chắc kiến thức tự luận mà còn phải tối ưu thời gian làm bài. Việc kết hợp máy tính cầm tay CASIO fx-580VN X đúng cách giúp các em kiểm tra nhanh kết quả rút gọn, nghiệm hệ phương trình và ứng dụng Định lý Vi-et.

### 1. Kiểm tra nghiệm phương trình bậc hai và Định lý Vi-et

Đối với phương trình bậc hai:
\\[ ax^2 + bx + c = 0 \\quad (a \\neq 0) \\]
Bấm **MENU &rarr; 9 &rarr; 2 &rarr; 2**, nhập hệ số \\(a, b, c\\). Máy tính không chỉ hiển thị ngay nghiệm \\(x_1, x_2\\) mà còn cho giá trị nhỏ nhất / lớn nhất của parabol, giúp giải nhanh các bài toán cực trị đại số.

Theo Định lý Vi-et:
\\[ S = x_1 + x_2 = -\\frac{b}{a}, \\quad P = x_1 x_2 = \\frac{c}{a} \\]
Học sinh có thể lưu nghiệm vào biến nhớ **STO &rarr; A** và **STO &rarr; B** để tính nhanh giá trị các biểu thức đối xứng phức tạp như \\(A^2 + B^2\\) hoặc \\(A^3 + B^3\\).

### 2. Kỹ thuật gán số (CALC) kiểm tra rút gọn biểu thức chứa căn

Với bài toán rút gọn biểu thức chứa căn thức bậc hai:
1. Nhập biểu thức đề bài \\(P\\) trừ đi biểu thức kết quả rút gọn \\(P'\\).
2. Bấm phím **CALC**, chọn một giá trị thỏa mãn điều kiện xác định (ví dụ \\(x = 25\\) hoặc \\(x = 9\\)).
3. Nếu kết quả màn hình hiển thị bằng **0**, phép biến đổi của em đã hoàn toàn chính xác!

### 3. Lời khuyên từ thầy cô Toan6789

- Luôn viết đầy đủ các bước lập luận, điều kiện xác định trước khi ghi kết quả.
- Dùng tính năng **Chấm điểm AI Toan6789** để được phát hiện sớm các lỗi trừ điểm ngớ ngẩn (thiếu điều kiện, sai dấu) trong quá trình luyện đề thi thử.`,
    category: 'Bi-Quyet-Thi',
    categoryLabel: 'Bí quyết thi vào 10',
    coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1200',
    author: {
      name: 'ThS. Nguyễn Văn An',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      role: 'Tổ trưởng Chuyên môn Toán Toan6789'
    },
    publishedAt: '12 Tháng 9, 2026',
    readTime: '6 phút đọc',
    featured: true,
    tags: ['Casio fx-580VNX', 'Toán 9', 'Thi vào 10', 'Mẹo giải nhanh']
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
        notes: `<div class="step-box">
  <strong class="text-primary text-[13px] uppercase font-bold tracking-wider">BƯỚC 1: DẠNG TOÁN & ĐỀ BÀI</strong>
  <p class="text-sm text-slate-700 mt-1">
    Cho hàm số bậc ba: $y = ax^3 + bx^2 + cx + d \\quad (a \\neq 0)$ có 2 điểm cực trị $x_1, x_2$.
  </p>
  <div class="formula-highlight math-font">
    y = \\left(\\frac{2c}{3} - \\frac{2b^2}{9a}\\right)x + \\left(d - \\frac{bc}{9a}\\right)
  </div>
</div>
<div class="step-box" style="border-left-color: #10B981;">
  <strong style="color: #059669;" class="text-[13px] uppercase font-bold tracking-wider">BƯỚC 2: MẸO BẤM MÁY TRONG 15 GIÂY</strong>
  <p class="text-sm text-slate-700 mt-1">
    Nhập lệnh <strong>MENU &rarr; 9 &rarr; 2 &rarr; 3</strong> trên fx-580VNX, nhập hệ số và ấn phím <strong>=</strong> liên tiếp để đọc ngay tọa độ cực trị ($x_{CĐ}, y_{CĐ}$) và ($x_{CT}, y_{CT}$).
  </p>
</div>
<div class="callout-warning">
  <strong>Lưu ý quan trọng:</strong> Luôn kiểm tra hệ số $a \\neq 0$ và xem màn hình máy tính có hiển thị đủ 2 cực trị trước khi kết luận.
</div>`
      },
      {
        id: 'short-2',
        youtubeUrl: 'https://www.youtube.com/shorts/jNQXAC9IVRw',
        videoId: 'jNQXAC9IVRw',
        title: 'Mẹo 2: Giải hệ phương trình bậc nhất hai ẩn & kiểm tra nghiệm vô số',
        duration: '0:52',
        notes: `<div class="step-box">
  <strong class="text-primary text-[13px] uppercase font-bold tracking-wider">BƯỚC 1: NHẬN DIỆN HỆ PHƯƠNG TRÌNH</strong>
  <p class="text-sm text-slate-700 mt-1">
    Hệ 2 phương trình bậc nhất 2 ẩn dạng chuẩn:
  </p>
  <div class="formula-highlight math-font">
    \\begin{cases} a_1 x + b_1 y = c_1 \\\\ a_2 x + b_2 y = c_2 \\end{cases}
  </div>
</div>
<div class="step-box" style="border-left-color: #10B981;">
  <strong style="color: #059669;" class="text-[13px] uppercase font-bold tracking-wider">BƯỚC 2: THAO TÁC CASIO 580VNX</strong>
  <p class="text-sm text-slate-700 mt-1">
    Bấm <strong>MENU &rarr; 9 &rarr; 1 &rarr; 2</strong>, sau đó nhập lần lượt các hệ số $a_1, b_1, c_1$ và $a_2, b_2, c_2$.
  </p>
</div>
<div class="callout-warning">
  <strong>Biện luận nhanh:</strong> Nếu màn hình báo <em>No Solution</em> thì hệ vô nghiệm; nếu báo <em>Infinite Solutions</em> thì hệ có vô số nghiệm.
</div>`
      },
      {
        id: 'short-3',
        youtubeUrl: 'https://www.youtube.com/shorts/kJQP7kiw5Fk',
        videoId: 'kJQP7kiw5Fk',
        title: 'Mẹo 3: Tìm nhanh BCNN và ƯCLN phân tích thừa số nguyên tố',
        duration: '0:38',
        notes: `<div class="step-box">
  <strong class="text-primary text-[13px] uppercase font-bold tracking-wider">BƯỚC 1: PHÂN TÍCH THỪA SỐ NGUYÊN TỐ (FACT)</strong>
  <p class="text-sm text-slate-700 mt-1">
    Nhập số cần phân tích (ví dụ $1260$) &rarr; bấm phím <strong>=</strong> &rarr; bấm tổ hợp <strong>SHIFT + FACT</strong> (phím dấu độ phút giây $\\circ '''$).
  </p>
  <div class="formula-highlight math-font">
    1260 = 2^2 \\times 3^2 \\times 5 \\times 7
  </div>
</div>
<div class="step-box" style="border-left-color: #10B981;">
  <strong style="color: #059669;" class="text-[13px] uppercase font-bold tracking-wider">BƯỚC 2: TÍNH NHANH GCD (ƯCLN) VÀ LCM (BCNN)</strong>
  <p class="text-sm text-slate-700 mt-1">
    - <strong>ƯCLN:</strong> Bấm <strong>ALPHA + (x)</strong> $(GCD) \\rightarrow a \\rightarrow$ <strong>SHIFT + )</strong> (,) $\\rightarrow b \\rightarrow$ <strong>) =</strong><br/>
    - <strong>BCNN:</strong> Bấm <strong>ALPHA + (÷)</strong> $(LCM) \\rightarrow a \\rightarrow$ <strong>SHIFT + )</strong> (,) $\\rightarrow b \\rightarrow$ <strong>) =</strong>
  </p>
</div>
<div class="callout-warning">
  <strong>Mẹo thi vào 10:</strong> Áp dụng để rút gọn phân số chứa căn hoặc phân tích đa thức thành nhân tử siêu tốc.
</div>`
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
    category: 'Giai-Toan-Dung-Hinh',
    categoryLabel: 'Giải toán dùng hình',
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
    slug: 'chien-thuat-phan-bo-thoi-gian-lam-bai-thi-toan-vao-10',
    title: 'Chiến thuật phân bổ 120 phút làm bài thi Toán tuyển sinh vào 10 đạt điểm 9+',
    content: `Đề thi tuyển sinh vào lớp 10 môn Toán thường có thời gian 120 phút với cấu trúc 5 bài tự luận chuẩn. Việc phân bổ thời gian hợp lý chính là chìa khóa vàng giúp học sinh giành trọn điểm số mà không bị mất điểm oan ở các câu cơ bản.

### Quy tắc 4 Chặng Thời Gian Vàng

1. **Chặng 1 (0 - 30 phút) - Quét sạch 5.0 điểm cơ bản:** Hoàn thành trọn vẹn Bài 1 (Rút gọn biểu thức chứa căn thức) và Bài 2 (Giải bài toán bằng cách lập phương trình/hệ phương trình). Đảm bảo kiểm tra kỹ điều kiện xác định và đối chiếu nghiệm.
2. **Chặng 2 (30 - 65 phút) - Chinh phục mốc 7.5 điểm:** Xử lý Bài 3 (Hệ phương trình và Phương trình bậc hai với tham số $m$, ứng dụng Định lý Vi-et).
3. **Chặng 3 (65 - 105 phút) - Đột phá Hình học (Bài 4):** Giải quyết câu a (chứng minh tứ giác nội tiếp) và câu b (chứng minh hệ thức hình học / tam giác đồng dạng).
4. **Chặng 4 (105 - 120 phút) - Về đích & Rà soát:** Dành 10 phút thử sức câu hình c hoặc bài 5 (Bất đẳng thức / Giá trị nhỏ nhất, lớn nhất). 5 phút cuối cùng kiểm tra lại đơn vị, kết luận và số báo danh.`,
    category: 'Bi-Quyet-Thi',
    categoryLabel: 'Bí quyết thi vào 10',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1200',
    author: {
      name: 'ThS. Nguyễn Văn An',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      role: 'Tổ trưởng Chuyên môn Toán Toan6789'
    },
    publishedAt: '05 Tháng 9, 2026',
    readTime: '5 phút đọc',
    featured: false,
    tags: ['Kỹ năng thi', 'Phân bổ thời gian', 'Thi vào 10', 'Kinh nghiệm']
  },
  {
    id: '5',
    slug: 'toan6789-ra-mat-tinh-nang-cham-nhan-xet-ai-moi',
    title: 'Toan6789 cập nhật giao diện Chấm điểm & Nhận xét AI mượt mà chuẩn Modern Academic',
    content: `Toan6789 vừa chính thức phát hành bản cập nhật giao diện mới theo chuẩn thiết kế **Modern Academic**.

### Những tính năng nổi bật trong bản cập nhật:

- **Giao diện Light Mode thanh lịch:** Tone màu Slate-50 và Blue 600 mang lại cảm giác dễ chịu khi học tập lâu dài.
- **Nút ✨ Xem Nhận xét AI:** Hiển thị popup nhận xét tư duy và chi tiết tự luận mượt mà không làm vỡ bố cục.
- **Bôi vàng lỗi sai thông minh:** Đánh dấu chính xác vị trí sai sót trên bài làm tự luận mà không làm mất đi các định dạng LaTeX hay thẻ HTML.
- **Ghi nhận Điểm Tối Đa:** Hiển thị rõ ràng điểm số đạt được trên thang điểm tối đa (ví dụ: \\(1.5 / 4.0\\)) giúp học sinh dễ dàng theo dõi mục tiêu học tập.`,
    category: 'Tin-Tuc',
    categoryLabel: 'Tin tức & Sự kiện',
    coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200',
    author: {
      name: 'Ban Biên Tập Toan6789',
      avatar: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=200',
      role: 'Đội ngũ Phát triển Sản phẩm'
    },
    publishedAt: '01 Tháng 9, 2026',
    readTime: '3 phút đọc',
    featured: false,
    tags: ['Cập nhật', 'Toan6789', 'Giao diện mới', 'AI Grader']
  },
  {
    id: '6',
    slug: 'phuong-phap-tim-ucln-bcnn-toan-6-kntt',
    title: 'Phương pháp tìm ƯCLN và BCNN Toán 6 cực nhanh kèm sơ đồ phân tích thừa số nguyên tố',
    content: `Ước chung lớn nhất (ƯCLN) và Bội chung nhỏ nhất (BCNN) là hai khái niệm nền tảng trong chương trình Toán 6 (Bộ sách Kết nối tri thức & Cánh diều).

### 1. Quy tắc 3 bước tìm ƯCLN và BCNN

1. **Phân tích mỗi số ra thừa số nguyên tố:**
   - Ví dụ: \\(24 = 2^3 \\cdot 3\\) và \\(36 = 2^2 \\cdot 3^2\\).
2. **Chọn thừa số nguyên tố:**
   - Đối với **ƯCLN**: Chọn các thừa số nguyên tố **chung**, lấy số mũ **nhỏ nhất**:
     \\[ \\text{ƯCLN}(24, 36) = 2^2 \\cdot 3 = 12 \\]
   - Đối với **BCNN**: Chọn các thừa số nguyên tố **chung và riêng**, lấy số mũ **lớn nhất**:
     \\[ \\text{BCNN}(24, 36) = 2^3 \\cdot 3^2 = 72 \\]
3. **Mẹo kiểm tra bằng tích:**
   \\[ \\text{ƯCLN}(a, b) \\cdot \\text{BCNN}(a, b) = a \\cdot b \\]

### 2. Ứng dụng giải bài toán thực tế chia tổ và chu kỳ gặp nhau
Học sinh lớp 6 cần chú ý các từ khóa: "chia đều", "nhiều nhất" thường gắn với bài toán tìm ƯCLN; "cùng một lúc", "lần tiếp theo" thường gắn với tìm BCNN.`,
    category: 'Meo-Tinh-Nhanh',
    categoryLabel: 'Mẹo tính nhanh',
    coverImage: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&q=80&w=1200',
    author: {
      name: 'Cô Hoàng Thu Thảo',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
      role: 'Giáo viên Toán THCS Toan6789'
    },
    publishedAt: '25 Tháng 8, 2026',
    readTime: '4 phút đọc',
    featured: false,
    tags: ['Toán 6', 'ƯCLN', 'BCNN', 'Số học THCS']
  },
  {
    id: '7',
    slug: 'chinh-phuc-so-huu-ti-so-thuc-toan-7',
    title: 'Chinh phục số hữu tỉ, số vô tỉ và căn bậc hai số học trong chương trình Toán 7 mới',
    content: `Chương trình Toán 7 mở rộng tập hợp số từ tập số tự nhiên \\(\\mathbb{N}\\), số nguyên \\(\\mathbb{Z}\\) sang tập số hữu tỉ \\(\\mathbb{Q}\\) và số thực \\(\\mathbb{R}\\).

### 1. Phân biệt Số hữu tỉ và Số vô tỉ
- **Số hữu tỉ (\\(\\mathbb{Q}\\)):** Biểu diễn được dưới dạng phân số \\(\\frac{a}{b}\\) với \\(a, b \\in \\mathbb{Z}, b \\neq 0\\). Ví dụ: \\(0.75 = \\frac{3}{4}\\), \\(-2.5 = -\\frac{5}{2}\\).
- **Số vô tỉ (\\(\\mathbb{I}\\)):** Số thập phân vô hạn không tuần hoàn. Điển hình là căn bậc hai không chính phương như \\(\\sqrt{2} \\approx 1.4142...\\), \\(\\pi \\approx 3.1415...\\).

### 2. Căn bậc hai số học
Căn bậc hai số học của một số \\(a \\ge 0\\) là số \\(x \\ge 0\\) sao cho \\(x^2 = a\\), ký hiệu là \\(\\sqrt{a}\\).
\\[ \\sqrt{a^2} = |a| \\]`,
    category: 'Meo-Tinh-Nhanh',
    categoryLabel: 'Mẹo tính nhanh',
    coverImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=1200',
    author: {
      name: 'ThS. Nguyễn Văn An',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      role: 'Tổ trưởng Chuyên môn Toán Toan6789'
    },
    publishedAt: '20 Tháng 8, 2026',
    readTime: '5 phút đọc',
    featured: false,
    tags: ['Toán 7', 'Số hữu tỉ', 'Số thực', 'Căn bậc hai']
  },
  {
    id: '8',
    slug: 'tuyet-chieu-7-hang-dang-thuc-dang-nho-toan-8',
    title: 'Tuyệt chiêu ghi nhớ 7 Hằng đẳng thức đáng nhớ & Phân tích đa thức thành nhân tử Toán 8',
    content: `7 Hằng đẳng thức đáng nhớ là "xương sống" của Đại số lớp 8 và là công cụ không thể thiếu khi giải phương trình lớp 9.

### 7 Hằng đẳng thức cốt lõi:
1. \\( (a + b)^2 = a^2 + 2ab + b^2 \\)
2. \\( (a - b)^2 = a^2 - 2ab + b^2 \\)
3. \\( a^2 - b^2 = (a - b)(a + b) \\)
4. \\( (a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3 \\)
5. \\( (a - b)^3 = a^3 - 3a^2b + 3ab^2 - b^3 \\)
6. \\( a^3 + b^3 = (a + b)(a^2 - ab + b^2) \\)
7. \\( a^3 - b^3 = (a - b)(a^2 + ab + b^2) \\)

### Mẹo thêm bớt hạng tử
Khi gặp đa thức bậc 4 dạng đối xứng \\(x^4 + 4y^4\\), thêm bớt \\(4x^2y^2\\) để xuất hiện hằng đẳng thức hiệu hai bình phương.`,
    category: 'Giai-Toan-Dung-Hinh',
    categoryLabel: 'Giải toán dùng hình',
    coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1200',
    author: {
      name: 'Cô Trần Minh Anh',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
      role: 'Giảng viên Hình học & Đại số'
    },
    publishedAt: '15 Tháng 8, 2026',
    readTime: '6 phút đọc',
    featured: false,
    tags: ['Toán 8', 'Hằng đẳng thức', 'Đại số 8', 'Phân tích đa thức']
  },
  {
    id: '9',
    slug: 'phuong-phap-ve-duong-phu-tu-giac-noi-tiep-toan-9',
    title: 'Phương pháp kẻ đường phụ chứng minh Tứ giác nội tiếp đường tròn ăn trọn điểm thi vào 10',
    content: `Trong cấu trúc đề thi tuyển sinh vào lớp 10, câu Hình học luôn chiếm từ 3.0 đến 3.5 điểm. Câu chứng minh tứ giác nội tiếp là câu "cho điểm" bắt buộc phải làm nhanh và chuẩn xác.

### 4 Dấu hiệu nhận biết Tứ giác nội tiếp:
1. **Tổng hai góc đối bằng 180°:** \\(\\widehat{A} + \\widehat{C} = 180^\\circ\\) hoặc \\(\\widehat{B} + \\widehat{D} = 180^\\circ\\).
2. **Hai đỉnh kề cùng nhìn một cạnh:** Hai đỉnh cùng nhìn đoạn thẳng nối hai đỉnh còn lại dưới hai góc bằng nhau.
3. **Góc ngoài tại một đỉnh bằng góc trong tại đỉnh đối:**
4. **Bốn đỉnh cách đều một điểm cố định.**

### 3 Đường phụ quen thuộc:
- Nối tâm đường tròn với tiếp điểm để tạo góc vuông \\(90^\\circ\\).
- Kẻ tiếp tuyến chung hoặc dây cung chung khi hai đường tròn cắt nhau.
- Kẻ đường kính để tạo góc nội tiếp chắn nửa đường tròn bằng \\(90^\\circ\\).`,
    category: 'Giai-Toan-Dung-Hinh',
    categoryLabel: 'Giải toán dùng hình',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1200',
    author: {
      name: 'ThS. Nguyễn Văn An',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      role: 'Tổ trưởng Chuyên môn Toán Toan6789'
    },
    publishedAt: '10 Tháng 8, 2026',
    readTime: '7 phút đọc',
    featured: false,
    tags: ['Toán 9', 'Tứ giác nội tiếp', 'Hình học 9', 'Thi vào 10']
  },
  {
    id: '10',
    slug: 'ky-thuat-bam-may-casio-fx880btg-toan-thcs',
    title: 'Kỹ thuật bấm máy tính Casio fx-880BTG và fx-580VNX tính nhanh bảng tần số & xác suất THCS',
    content: `Bộ Giáo Dục đã đưa nội dung Thống kê và Xác suất vào đề thi Toán tuyển sinh THCS với các chỉ số: Số trung bình, Trung vị, Mốt, và Tứ phân vị.

### 1. Thao tác trên Casio fx-580VN X:
- Bấm **MENU &rarr; 6 (Thống kê)**.
- Chọn **1: 1-Variable** để nhập dữ liệu mẫu số liệu.
- Bấm **OPTN &rarr; 2: 1-Variable Calc** để màn hình hiển thị toàn bộ:
  - Trung bình cộng \\(\\bar{x}\\).
  - Trung vị \\(Med\\).
  - Tứ phân vị \\(Q_1, Q_2, Q_3\\).
  - Độ lệch chuẩn \\(\\sigma_x\\).

### 2. Thao tác trên Casio fx-880BTG:
- Sử dụng phím **HOME &rarr; Statistics &rarr; 1-Variable**.
- Dùng tính năng MathBox để mô phỏng xác suất gieo xúc xắc và tung đồng xu trực quan.`,
    category: 'Meo-Casio',
    categoryLabel: 'Mẹo Casio',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200',
    author: {
      name: 'Thầy Trần Đình Bình',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      role: 'Chuyên gia Máy tính Cầm tay THCS'
    },
    publishedAt: '05 Tháng 8, 2026',
    readTime: '5 phút đọc',
    featured: false,
    tags: ['Casio fx-880BTG', 'Casio fx-580VNX', 'Thống kê THCS', 'Mẹo Casio']
  },
  {
    id: '11',
    slug: 'cam-nang-10-bai-toan-thuc-te-hay-gap-thi-vao-10',
    title: 'Cẩm nang ôn thi vào 10: Tổng hợp 10 dạng toán thực tế ứng dụng hàm số bậc nhất và hình học',
    content: `Toán thực tế chiếm từ 1.0 đến 1.5 điểm trong đề thi vào 10 tại Hà Nội, TP.HCM, Đà Nẵng và nhiều tỉnh thành.

### Các dạng toán thực tế trọng điểm:
1. **Bài toán kinh tế & Giá tiền điện/nước/cước taxi:** Mô hình hàm số bậc nhất từng khúc \\(y = ax + b\\).
2. **Bài toán nồng độ dung dịch & Hỗn hợp hóa học:** Lập hệ phương trình bảo toàn khối lượng chất tan.
3. **Bài toán hình học thực tế:** Tính chiều cao tòa nhà, tháp truyền hình bằng tỉ số lượng giác góc nâng / góc hạ; Tính thể tích bồn nước hình trụ, hình nón, hình cầu.
4. **Bài toán lãi suất và tăng trưởng dân số:** Ứng dụng công thức lãi kép.

Học sinh cần rèn luyện kỹ năng đọc hiểu đề bài, chuyển đổi ngôn ngữ đời sống sang ngôn ngữ ký hiệu toán học chính xác.`,
    category: 'Bi-Quyet-Thi',
    categoryLabel: 'Bí quyết thi vào 10',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1200',
    author: {
      name: 'ThS. Nguyễn Văn An',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      role: 'Tổ trưởng Chuyên môn Toán Toan6789'
    },
    publishedAt: '01 Tháng 8, 2026',
    readTime: '6 phút đọc',
    featured: false,
    tags: ['Toán thực tế', 'Thi vào 10', 'Hàm số bậc nhất', 'Hình học thực tế']
  }
]

const LOCAL_STORAGE_KEY = 'toan6789_custom_blog_posts'
const LEGACY_STORAGE_KEY = 'toan24h_custom_blog_posts'

export function getBlogPosts(): BlogPost[] {
  if (typeof window === 'undefined') {
    return BLOG_POSTS
  }
  try {
    const customPostsStr = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)
    if (customPostsStr) {
      const customPosts: BlogPost[] = JSON.parse(customPostsStr)
      if (Array.isArray(customPosts)) {
        // Deduplicate: custom posts override default posts with matching id or slug
        const customIds = new Set(customPosts.map(p => String(p.id)))
        const customSlugs = new Set(customPosts.map(p => p.slug))
        const remainingDefaults = BLOG_POSTS.filter(p => !customIds.has(String(p.id)) && !customSlugs.has(p.slug))
        return [...customPosts, ...remainingDefaults]
      }
    }
  } catch (e) {
    console.error('Error reading custom blog posts from localStorage', e)
  }
  return BLOG_POSTS
}

export function addBlogPost(post: BlogPost): BlogPost {
  if (typeof window !== 'undefined') {
    try {
      const customPostsStr = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)
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

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export interface TocHeadingItem {
  id: string
  title: string
  raw: string
}

export function extractH1Headings(rawContent: string): TocHeadingItem[] {
  if (!rawContent) return []
  const items: TocHeadingItem[] = []

  // 1. Quét thẻ HTML <h1>: <h1 ...>Tiêu đề</h1>
  const htmlRegex = /<h1(?:\s+id=["']([^"']+)["'])?[^>]*>(.*?)<\/h1>/gi
  let match
  while ((match = htmlRegex.exec(rawContent)) !== null) {
    const rawTitle = match[2].replace(/<[^>]+>/g, '').trim()
    if (rawTitle) {
      const slugId = match[1] || slugify(rawTitle) || `heading-${items.length + 1}`
      items.push({ id: slugId, title: rawTitle, raw: match[0] })
    }
  }

  // 2. Quét Markdown # Tiêu đề (dòng bắt đầu bằng # kèm space)
  const lines = rawContent.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    const mdMatch = trimmed.match(/^#\s+([^#].*)$/)
    if (mdMatch) {
      const rawTitle = mdMatch[1].trim()
      if (rawTitle && !items.some(it => it.title === rawTitle)) {
        items.push({
          id: slugify(rawTitle) || `heading-${items.length + 1}`,
          title: rawTitle,
          raw: line
        })
      }
    }
  }

  return items
}


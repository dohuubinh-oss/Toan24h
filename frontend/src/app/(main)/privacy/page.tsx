'use client'

import React from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  ArrowLeft,
  Lock,
  Trash2,
  CheckCircle2,
  FileText,
  AlertCircle,
} from 'lucide-react'
import HomeFooter from '@/components/home/HomeFooter'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-primary/20">
      <main className="flex-1 py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb / Back button */}
          <div className="mb-6 sm:mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại trang chủ</span>
            </Link>
          </div>

          {/* Header */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm mb-8">
            <div className="flex items-center gap-3 text-primary mb-3">
              <ShieldCheck className="w-8 h-8" />
              <span className="font-bold text-xs uppercase tracking-wider bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                Toan6789 Privacy
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              Chính Sách Bảo Mật Quyền Riêng Tư &amp; Bảo Vệ Dữ Liệu Cá Nhân
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mb-2">
              Tuân thủ Nghị định 13/2023/NĐ-CP của Chính phủ về Bảo vệ Dữ liệu Cá nhân và Luật An toàn Thông tin Mạng.
            </p>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Chúng tôi cam kết tôn trọng và bảo vệ quyền riêng tư của mọi học sinh, phụ huynh và giáo viên khi tham gia học tập trên nền tảng toan6789.vn. Văn bản này làm rõ mục đích thu thập, phạm vi xử lý và quyền hạn của bạn đối với dữ liệu cá nhân.
            </p>
          </div>

          {/* Content Sections */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-10 text-slate-700 text-sm sm:text-base leading-relaxed">
            {/* Section 1 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  1
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Loại Dữ Liệu Chúng Tôi Thu Thập
                </h2>
              </div>
              <div className="space-y-3 pl-0 sm:pl-12 text-slate-700">
                <p>
                  Để cung cấp dịch vụ khóa học trực tuyến và chức năng chấm bài tự động, chúng tôi chỉ thu thập các thông tin tối thiểu cần thiết bao gồm:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                  <li><strong>Thông tin tài khoản:</strong> Họ và tên, địa chỉ email, khối lớp đang theo học, mật khẩu đã được mã hóa một chiều (bcrypt).</li>
                  <li><strong>Dữ liệu bài tập &amp; hình ảnh bài làm:</strong> Các tệp hình ảnh bài làm tự luận do học sinh chủ động tải lên để hệ thống nhận diện ký tự (OCR) và chấm điểm.</li>
                  <li><strong>Thông tin tiến trình học tập:</strong> Điểm số các bài luyện tập, bài thi thử, lịch sử nộp bài nhằm hỗ trợ thống kê tiến độ học tập.</li>
                </ul>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  2
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Bảo Mật Dữ Liệu Bài Làm &amp; Trí Tuệ Nhân Tạo (AI)
                </h2>
              </div>
              <div className="space-y-3 pl-0 sm:pl-12 text-slate-700">
                <p>
                  Chúng tôi xử lý hình ảnh bài làm tự luận thông qua Giao diện lập trình ứng dụng (API) thương mại của Google:
                </p>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs sm:text-sm text-emerald-900 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Cam kết bảo mật dữ liệu bài làm:</span>
                  </p>
                  <p>
                    Dữ liệu bài làm của học sinh được truyền tải qua đường truyền mã hóa SSL/TLS an toàn và tuyệt đối <strong>không được dùng để huấn luyện (train)</strong> các mô hình AI công cộng.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 - Exact Text Required */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  3
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Quyền Yêu Cầu Xóa Dữ Liệu &amp; Xóa Tài Khoản Vĩnh Viễn
                </h2>
              </div>
              <div className="space-y-4 pl-0 sm:pl-12 text-slate-700">
                <p>
                  Theo quy định tại Nghị định 13/2023/NĐ-CP về Bảo vệ Dữ liệu Cá nhân, người dùng có toàn quyền yêu cầu xóa bỏ vĩnh viễn tài khoản và thông tin cá nhân của mình bất kỳ lúc nào.
                </p>

                {/* Exact user requirement quote */}
                <div className="p-5 bg-blue-50/80 rounded-2xl border border-blue-200/80 text-xs sm:text-sm text-slate-800 space-y-2">
                  <p className="font-bold text-primary flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                    <span>Cam kết xử lý xóa dữ liệu:</span>
                  </p>
                  <p className="font-semibold text-slate-900 leading-relaxed text-sm sm:text-base">
                    &ldquo;Khi người dùng yêu cầu xóa tài khoản, chúng tôi cam kết hủy bỏ toàn bộ dữ liệu định danh và hình ảnh bài làm trong vòng 72 giờ làm việc, hệ thống chỉ giữ lại các dữ liệu điểm số đã được ẩn danh hoàn toàn nhằm mục đích thống kê chung.&rdquo;
                  </p>
                  <p className="text-xs text-slate-600 pt-1 leading-relaxed">
                    Hệ thống cung cấp sẵn tính năng tự động: Người dùng chỉ cần vào mục <strong>Cài đặt tài khoản (Hồ sơ cá nhân)</strong> &gt; nhấn nút <strong>&ldquo;Yêu cầu xóa tài khoản vĩnh viễn&rdquo;</strong>. Hệ thống sẽ tự động thực hiện lệnh xóa vật lý (Hard delete) ngay lập tức trên máy chủ.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-1">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Quy trình Xóa Vật Lý (Hard delete) được thực thi:</span>
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                    <li>Xóa vĩnh viễn thông tin cá nhân: Họ tên, email, ảnh đại diện khỏi cơ sở dữ liệu.</li>
                    <li>Quét sạch và xóa vật lý toàn bộ các file ảnh bài làm tự luận, hình vẽ đính kèm trên ổ đĩa máy chủ lưu trữ.</li>
                    <li>Xóa toàn bộ phiên đăng nhập, cookie xác thực và liên kết dịch vụ (như Telegram).</li>
                    <li>Các kết quả làm bài được ẩn danh hóa (xóa liên kết UserID), không còn bất kỳ dấu vết định danh nào của người dùng.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  4
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Thông Tin Liên Hệ Cơ Quan Quản Lý &amp; Hỗ Trợ
                </h2>
              </div>
              <div className="space-y-3 pl-0 sm:pl-12 text-slate-700 text-xs sm:text-sm">
                <p>
                  Nếu bạn có bất kỳ câu hỏi nào về chính sách bảo mật hoặc muốn thực thi các quyền liên quan đến dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP, vui lòng liên hệ:
                </p>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p><strong>Ban Quản Trị toan6789.vn</strong></p>
                  <p>Email tiếp nhận yêu cầu bảo mật: <a href="mailto:support@toan6789.vn" className="text-primary font-bold hover:underline">support@toan6789.vn</a></p>
                  <p>Thời gian phản hồi cam kết: Trong vòng 24 - 72 giờ làm việc.</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <HomeFooter />
    </div>
  )
}

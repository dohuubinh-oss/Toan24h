'use client'

import React from 'react'
import Link from 'next/link'
import {
  GraduationCap,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Lock,
  CreditCard,
  Ban,
  Scale,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react'
import HomeFooter from '@/components/home/HomeFooter'

export default function TermsPage() {
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
              <GraduationCap className="w-8 h-8" />
              <span className="font-bold text-xs uppercase tracking-wider bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                Toan6789 Education
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              Điều Khoản Dịch Vụ &amp; Quy Chế Hoạt Động
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mb-2">
              Ban hành và áp dụng chính thức từ năm 2026 • Tuân thủ Luật Bảo vệ quyền lợi người tiêu dùng 2023, Nghị định 13/2023/NĐ-CP và Quy chuẩn Thương mại điện tử Bộ Công Thương.
            </p>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Chào mừng bạn đến với toan6789.vn. Bằng việc truy cập, đăng ký tài khoản hoặc sử dụng bất kỳ dịch vụ nào trên hệ thống, bạn xác nhận đã đọc, hiểu và đồng ý tuân thủ toàn bộ các điều khoản và điều kiện dưới đây.
            </p>
          </div>

          {/* Main Terms Container */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-10 text-slate-700 text-sm sm:text-base leading-relaxed">

            {/* Điều 1 */}
            <section id="dieu-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  1
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Điều 1: Chấp Thuận Điều Khoản và Độ Tuổi Sử Dụng
                </h2>
              </div>
              <div className="space-y-3 pl-0 sm:pl-12">
                <p>
                  1.1. <strong>Đối tượng phục vụ:</strong> Nền tảng toan6789.vn được thiết kế chuyên biệt để cung cấp các khóa học trực tuyến và hỗ trợ giáo dục môn Toán cho học sinh phổ thông cấp Trung học cơ sở (từ Lớp 6 đến Lớp 9).
                </p>
                <p>
                  1.2. <strong>Xác lập giao dịch &amp; Người giám hộ:</strong> Theo quy định của Bộ luật Dân sự Việt Nam và Luật Bảo vệ quyền lợi người tiêu dùng 2023, người trực tiếp đăng ký tài khoản và xác lập các giao dịch thanh toán học phí phải là người <strong>từ đủ 18 tuổi trở lên</strong> hoặc phải có sự giám sát, đồng thuận hợp pháp của cha mẹ hoặc người giám hộ hợp pháp.
                </p>
                <p>
                  1.3. Khi nhấn nút đăng ký tài khoản hoặc thanh toán, người dùng khẳng định đã đạt độ tuổi quy định hoặc đã có sự đồng ý đầy đủ của cha mẹ/người giám hộ.
                </p>
              </div>
            </section>

            {/* Điều 2 */}
            <section id="dieu-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  2
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Điều 2: Mô Tả Dịch Vụ và Chính Sách Trí Tuệ Nhân Tạo (AI)
                </h2>
              </div>
              <div className="space-y-4 pl-0 sm:pl-12">
                <p>
                  2.1. <strong>Danh mục dịch vụ cung ứng:</strong> toan6789.vn cung cấp các Khóa học trực tuyến, bài giảng lý thuyết chuẩn khung GDPT mới, ngân hàng câu hỏi trắc nghiệm &amp; tự luận trực tuyến, tính năng nhận diện chữ viết tay qua ảnh chụp (OCR) và chấm điểm tự luận tự động.
                </p>
                
                {/* AI Disclaimer Legal Section verbatim */}
                <div className="p-5 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-amber-900 text-sm sm:text-base">
                    <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>Chính sách sử dụng tính năng Trí tuệ Nhân tạo (AI Disclaimer):</span>
                  </div>
                  <div className="space-y-2 text-xs sm:text-sm text-slate-700">
                    <p>
                      <strong>a. Bản chất dịch vụ:</strong> Ứng dụng cung cấp tính năng hỗ trợ nhận diện văn bản (OCR) và tự động chấm điểm bài làm tự luận thông qua việc tích hợp Giao diện lập trình ứng dụng (API) Trí tuệ nhân tạo do bên thứ ba (Google) cung cấp.
                    </p>
                    <p>
                      <strong>b. Giới hạn độ chính xác:</strong> Mặc dù hệ thống AI được cấu hình để đánh giá dựa trên tiêu chuẩn giáo dục, chúng tôi không bảo đảm tính chính xác, đầy đủ hoặc phù hợp tuyệt đối 100% của các nhận xét, điểm số hay đề xuất sửa lỗi. Người dùng đồng ý tự chịu rủi ro khi sử dụng các kết quả này làm căn cứ học tập.
                    </p>
                    <p>
                      <strong>c. Quyền xử lý dữ liệu:</strong> Bằng việc tải hình ảnh bài làm lên hệ thống, người dùng (và người giám hộ hợp pháp) cấp quyền cho chúng tôi truyền tải dữ liệu dạng ẩn danh qua máy chủ AI để xử lý. Chúng tôi cam kết sử dụng API thương mại, dữ liệu bài làm của người dùng tuyệt đối không được sử dụng để huấn luyện (train) các mô hình AI công cộng.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 italic">
                  * Khuyến cáo trên giao diện: Kết quả nhận diện chữ viết (OCR) và chấm điểm tự luận được thực hiện hoàn toàn tự động bởi Trí tuệ Nhân tạo (AI). Điểm số và nhận xét chỉ mang tính chất tham khảo, giúp học sinh tự đánh giá năng lực và không thay thế cho kết quả chấm thi chính thức từ giáo viên.
                </p>

                <p>
                  2.2. <strong>Chính sách Điểm số, Huy hiệu và Vật phẩm ảo:</strong> Điểm số, huy hiệu và các vật phẩm ảo trên hệ thống chỉ có giá trị ghi nhận thành tích học tập nội bộ, không có giá trị quy đổi thành tiền mặt, thẻ cào, hay tài sản thực tế dưới bất kỳ hình thức nào. Hệ thống tuyệt đối không cung cấp bất kỳ tính năng nạp rút tiền, quy đổi tiền tệ hoặc chuyển nhượng tài sản ảo giữa các tài khoản người dùng.
                </p>
              </div>
            </section>

            {/* Điều 3 */}
            <section id="dieu-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  3
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Điều 3: Quy Định về Đăng Ký và Bảo Mật Tài Khoản
                </h2>
              </div>
              <div className="space-y-3 pl-0 sm:pl-12">
                <p>
                  3.1. <strong>Trách nhiệm bảo mật:</strong> Người dùng có trách nhiệm tự bảo mật mật khẩu, mã xác thực và thông tin tài khoản cá nhân. Người dùng phải thông báo ngay cho ban quản trị nếu phát hiện dấu hiệu truy cập trái phép.
                </p>
                <p>
                  3.2. <strong>Quy định 1 tài khoản cho 1 cá nhân:</strong> Mỗi tài khoản học tập chỉ được cấp quyền sử dụng cho <strong>duy nhất 01 cá nhân</strong>. Nghiêm cấm mọi hình thức mua chung tài khoản, cho mượn tài khoản hoặc chia sẻ tài khoản cho tập thể/nhiều người cùng sử dụng.
                </p>
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs sm:text-sm text-rose-800 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Chế tài vi phạm:</span>
                  </p>
                  <p>
                    Nếu hệ thống phát hiện 01 tài khoản đăng nhập đồng thời từ nhiều địa chỉ IP bất thường hoặc có hành vi chia sẻ trái phép, tài khoản sẽ bị <strong>khóa vĩnh viễn không hoàn tiền</strong> mà không cần báo trước.
                  </p>
                </div>

                <p>
                  3.3. <strong>Chính sách Bảo mật Dữ liệu &amp; Quyền xóa tài khoản vĩnh viễn (Nghị định 13/2023/NĐ-CP):</strong>
                </p>
                <p>
                  Người dùng có quyền kiểm soát toàn diện đối với dữ liệu cá nhân của mình và có thể chủ động kích hoạt tính năng &ldquo;Yêu cầu xóa tài khoản vĩnh viễn&rdquo; bất kỳ lúc nào trực tiếp trong phần Cài đặt tài khoản (Hồ sơ cá nhân).
                </p>
                <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200/80 text-xs sm:text-sm text-slate-800 space-y-1.5">
                  <p className="font-bold text-primary flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                    <span>Cam kết bảo vệ dữ liệu cá nhân &amp; Xóa dữ liệu:</span>
                  </p>
                  <p className="font-medium text-slate-900">
                    &ldquo;Khi người dùng yêu cầu xóa tài khoản, chúng tôi cam kết hủy bỏ toàn bộ dữ liệu định danh và hình ảnh bài làm trong vòng 72 giờ làm việc, hệ thống chỉ giữ lại các dữ liệu điểm số đã được ẩn danh hoàn toàn nhằm mục đích thống kê chung.&rdquo;
                  </p>
                  <p className="text-xs text-slate-600 pt-1">
                    Thao tác xóa tài khoản trên hệ thống sẽ kích hoạt lệnh xóa vật lý (Hard delete) để quét sạch họ tên, email, ảnh đại diện và toàn bộ các tệp tin hình ảnh bài tự luận đã tải lên khỏi máy chủ lưu trữ.
                  </p>
                </div>
              </div>
            </section>

            {/* Điều 4 */}
            <section id="dieu-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  4
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Điều 4: Sở Hữu Trí Tuệ và Bản Quyền
                </h2>
              </div>
              <div className="space-y-3 pl-0 sm:pl-12">
                <p>
                  4.1. <strong>Bảo vệ quyền sở hữu của toan6789.vn:</strong> Toàn bộ cấu trúc website, giao diện, mã nguồn, bài giảng lý thuyết, cơ sở dữ liệu câu hỏi, thuật toán xử lý hình vẽ SVG và kho đề thi thuộc quyền sở hữu trí tuệ hợp pháp của toan6789.vn. Nghiêm cấm mọi hành vi sao chép, trích xuất dữ liệu tự động (crawling/scraping), đảo ngược mã nguồn hoặc phát tán thương mại khi chưa có văn bản đồng ý.
                </p>
                <p>
                  4.2. <strong>Bảo vệ quyền sở hữu của người dùng (UGC):</strong> Đối với các bài làm viết tay do học sinh tải lên, bản quyền bài làm thuộc về học sinh. Tuy nhiên, học sinh (và người giám hộ) cấp cho toan6789.vn một <em>"Giấy phép không độc quyền, miễn phí, có giới hạn mục đích"</em> để hệ thống thực hiện OCR, phân tích toán học, lưu trữ lịch sử chấm bài và phục vụ tiến trình học tập của chính học sinh.
                </p>
                <p>
                  4.3. <strong>Tài nguyên và nội dung bên thứ ba:</strong> Hệ thống có thể sử dụng tính năng nhúng (embed) các tài liệu, video từ các nền tảng bên thứ ba (như YouTube, Facebook) nhằm mục đích minh họa giáo dục. Bản quyền của các nội dung này thuộc về tác giả gốc. Chúng tôi không sở hữu, không lưu trữ và không chịu trách nhiệm về bất kỳ thay đổi nội dung nào từ nguồn phát gốc.
                </p>
                <p>
                  4.4. <strong>Chính sách xử lý vi phạm bản quyền &amp; Quy trình gỡ bỏ (Notice &amp; Takedown):</strong>
                </p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 text-xs sm:text-sm text-slate-800 space-y-2">
                  <p className="font-medium text-slate-900 leading-relaxed">
                    &ldquo;Chúng tôi luôn tôn trọng quyền Sở hữu trí tuệ. Một số tài nguyên trên hệ thống được sưu tầm từ Internet với tác giả khuyết danh nhằm mục đích chia sẻ kiến thức. Nếu bạn là tác giả hoặc chủ sở hữu bản quyền của bất kỳ nội dung nào đang hiển thị trên hệ thống và không đồng ý với việc này, vui lòng gửi thông báo kèm bằng chứng sở hữu đến email: <a href="mailto:support@toan6789.vn" className="text-primary font-bold hover:underline">support@toan6789.vn</a>. Chúng tôi cam kết sẽ kiểm tra và gỡ bỏ nội dung vi phạm ngay lập tức trong vòng 48 giờ làm việc kể từ khi nhận được yêu cầu hợp lệ.&rdquo;
                  </p>
                  <p className="text-xs text-slate-500">
                    Quy trình tiếp nhận và xử lý khiếu nại bản quyền được thực hiện minh bạch, bảo đảm quyền lợi hợp pháp của tác giả gốc theo quy định của Luật Sở hữu trí tuệ Việt Nam.
                  </p>
                </div>
              </div>
            </section>

            {/* Điều 5 */}
            <section id="dieu-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  5
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Điều 5: Chính Sách Thanh Toán và Kích Hoạt Dịch Vụ
                </h2>
              </div>
              <div className="space-y-3 pl-0 sm:pl-12">
                <p>
                  5.1. <strong>Hình thức thanh toán:</strong> Hệ thống chấp nhận thanh toán học phí qua phương thức Chuyển khoản ngân hàng tự động quét mã chuẩn VietQR (hỗ trợ qua cổng thanh toán PayOS kết nối tất cả các ngân hàng tại Việt Nam, Napas247, MB Bank, VNPay, MoMo).
                </p>
                <p>
                  5.2. <strong>Thời điểm kích hoạt:</strong> Dịch vụ khóa học trực tuyến được kích hoạt tự động <strong>ngay lập tức (trong vòng 3-5 giây)</strong> sau khi cổng thanh toán gửi tín hiệu xác nhận giao dịch thành công. Người dùng không phải chờ đợi phê duyệt thủ công.
                </p>
                <p>
                  5.3. <strong>Thuế &amp; Hóa đơn:</strong> Dịch vụ cung cấp là Khóa học trực tuyến và Dịch vụ hỗ trợ giáo dục, thuộc đối tượng không chịu thuế GTGT theo Khoản 13 Điều 5 Luật Thuế Giá trị gia tăng và áp dụng mức thuế suất 2% TNCN đối với dịch vụ giáo dục đào tạo theo Thông tư 40/2021/TT-BTC.
                </p>
                <div className="p-5 bg-blue-50/80 rounded-2xl border border-blue-200/90 space-y-2 mt-3">
                  <div className="flex items-center gap-2 font-bold text-blue-900 text-sm sm:text-base">
                    <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
                    <span>Chính sách định danh dịch vụ &amp; Hóa đơn học phí:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    Toan6789.vn cung cấp các <strong>Khóa học trực tuyến</strong>, <strong>Dịch vụ hỗ trợ giáo dục</strong> và công nghệ <strong>Chấm bài tự động</strong> dành cho học sinh THCS. Theo Khoản 13 Điều 5 Luật Thuế giá trị gia tăng số 13/2008/QH12 (sửa đổi, bổ sung) và Thông tư 40/2021/TT-BTC, hoạt động dạy học, đào tạo trực tuyến thuộc đối tượng <strong>không chịu thuế GTGT</strong> (áp dụng mức thuế suất 2% TNCN đối với dịch vụ giáo dục). Toàn bộ biên lai và giao dịch ngân hàng được ghi nhận đúng chuẩn là <em>Phí dịch vụ hỗ trợ giáo dục và Khóa học trực tuyến</em>.
                  </p>
                </div>
              </div>
            </section>

            {/* Điều 6 */}
            <section id="dieu-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  6
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Điều 6: Chính Sách Hoàn Tiền (Theo Quy Chuẩn Bộ Công Thương)
                </h2>
              </div>
              <div className="space-y-3 pl-0 sm:pl-12">
                <div className="p-5 bg-slate-100 rounded-2xl border border-slate-300/80 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  <p className="mb-2 font-bold text-slate-900 uppercase tracking-wide">
                    Quy định hoàn tiền đối với dịch vụ nội dung số:
                  </p>
                  <p>
                    “Vì bản chất của sản phẩm là dịch vụ nội dung số và quyền truy cập ngay lập tức, chúng tôi áp dụng chính sách <strong>KHÔNG HOÀN TIỀN</strong> dưới mọi hình thức sau khi giao dịch thanh toán đã hoàn tất và tài khoản đã được kích hoạt thành công, trừ trường hợp lỗi kỹ thuật phát sinh từ phía máy chủ của chúng tôi khiến người dùng không thể truy cập dịch vụ quá 48 giờ liên tục.”
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  Người dùng được khuyến khích trải nghiệm các bài giảng và đề thi miễn phí sẵn có trên nền tảng trước khi quyết định nâng cấp gói học trả phí.
                </p>
              </div>
            </section>

            {/* Điều 7 */}
            <section id="dieu-7">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  7
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Điều 7: Hành Vi Bị Cấm và Trách Nhiệm Dữ Liệu Tải Lên (UGC)
                </h2>
              </div>
              <div className="space-y-3 pl-0 sm:pl-12">
                <p>
                  7.1. <strong>Các hành vi nghiêm cấm tuyệt đối:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                  <li>Tải lên hình ảnh mang nội dung đồi trụy, khiêu dâm, bạo lực, vi phạm thuần phong mỹ tục.</li>
                  <li>Tải lên tài liệu chính trị, chống phá Nhà nước, vi phạm Luật An ninh mạng Việt Nam.</li>
                  <li>Tải lên hình ảnh rác, hình ảnh không liên quan đến bài tập toán học nhằm mục đích phá hoại hệ thống OCR/AI.</li>
                  <li>Sử dụng các công cụ can thiệp bot, script tự động nhằm gian lận điểm số trên bảng xếp hạng.</li>
                  <li>Thực hiện, chào mời, yêu cầu hoặc tổ chức quy đổi điểm số, huy hiệu hoặc vật phẩm học tập ảo thành tiền mặt, thẻ cào hay tài sản thực tế.</li>
                </ul>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs sm:text-sm text-amber-900">
                  <p className="font-bold mb-1">Quyền của Ban Quản Trị:</p>
                  <p>
                    Ban quản trị có quyền xóa tài khoản ngay lập tức, chuyển giao thông tin và bằng chứng cho cơ quan chức năng có thẩm quyền theo quy định của pháp luật, và không hoàn tiền dưới bất kỳ hình thức nào nếu người dùng vi phạm các điều khoản trên.
                  </p>
                </div>
              </div>
            </section>

            {/* Điều 8 */}
            <section id="dieu-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  8
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Điều 8: Giải Quyết Tranh Chấp và Luật Áp Dụng
                </h2>
              </div>
              <div className="space-y-3 pl-0 sm:pl-12">
                <p>
                  8.1. <strong>Luật điều chỉnh:</strong> Mọi điều khoản và quan hệ sử dụng dịch vụ giữa người dùng và toan6789.vn được điều chỉnh và giải thích theo pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.
                </p>
                <p>
                  8.2. <strong>Thương lượng thiện chí:</strong> Mọi tranh chấp phát sinh trong quá trình sử dụng dịch vụ trước hết sẽ được ưu tiên giải quyết thông qua thương lượng thiện chí giữa hai bên. Người dùng có thể liên hệ trực tiếp qua Email hỗ trợ: <a href="mailto:support@toan6789.vn" className="text-primary font-bold hover:underline">support@toan6789.vn</a> hoặc Hotline hỗ trợ trên hệ thống.
                </p>
                <p>
                  8.3. <strong>Thẩm quyền tòa án:</strong> Trong trường hợp tranh chấp không thể giải quyết bằng thương lượng trong vòng 30 ngày kể từ ngày phát sinh khiếu nại, một trong hai bên có quyền đưa vụ việc ra giải quyết tại <strong>Tòa án nhân dân có thẩm quyền tại Việt Nam</strong> theo quy định của pháp luật Việt Nam.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <HomeFooter />
    </div>
  )
}

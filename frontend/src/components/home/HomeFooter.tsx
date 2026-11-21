import React from 'react'
import Link from 'next/link'
import { Globe, MessageCircle, Mail } from 'lucide-react'
import Logo from '@/components/common/Logo'

export default function HomeFooter() {
  return (
    <footer className="bg-slate-50 pt-20 pb-10 border-t border-slate-200/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2">
            <div className="mb-6">
              <Logo size="md" />
            </div>
            <p className="text-slate-600 max-w-sm mb-6 leading-relaxed text-sm">
              Cung cấp Khóa học trực tuyến, Dịch vụ hỗ trợ giáo dục và công nghệ Chấm bài tự động giúp học sinh THCS bứt phá điểm số và tự tin làm chủ môn Toán.
            </p>
            <div className="flex gap-4">
              <Link 
                className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all min-w-[44px] min-h-[44px] cursor-pointer" 
                href="/"
                aria-label="Website toan6789.vn"
              >
                <Globe className="w-5 h-5" />
              </Link>
              <a 
                className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all min-w-[44px] min-h-[44px] cursor-pointer" 
                href="https://t.me/toan6789_bot"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Cộng đồng MathAI trên Telegram"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a 
                className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all min-w-[44px] min-h-[44px] cursor-pointer" 
                href="mailto:support@toan6789.vn"
                aria-label="Email liên hệ hỗ trợ: support@toan6789.vn"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-6 text-slate-900 text-sm tracking-wide">Liên kết</h3>
            <ul className="space-y-4 text-slate-600 text-sm">
              <li><Link className="hover:text-primary transition-colors" href="/about">Về chúng tôi</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/lectures">Bài giảng lý thuyết</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/exams">Kho đề thi thử</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/leaderboard">Bảng xếp hạng</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-6 text-slate-900 text-sm tracking-wide">Hỗ trợ</h3>
            <ul className="space-y-4 text-slate-600 text-sm">
              <li><Link className="hover:text-primary transition-colors" href="/upgrade">Gói cước & Học phí</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/terms">Điều khoản dịch vụ &amp; Chính sách</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/privacy">Chính sách bảo mật dữ liệu</Link></li>
              <li><a className="hover:text-primary transition-colors" href="mailto:support@toan6789.vn">Trung tâm trợ giúp</a></li>
              <li><a className="hover:text-primary transition-colors" href="mailto:support@toan6789.vn">Liên hệ</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 text-center text-slate-600 text-sm">
          <p>© 2026 toan6789.vn - Khóa học trực tuyến & Dịch vụ hỗ trợ giáo dục Toán THCS.</p>
        </div>
      </div>
    </footer>
  )
}

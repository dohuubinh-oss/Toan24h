import React from 'react'
import { FunctionSquare, Globe, MessageCircle, Mail } from 'lucide-react'

export default function HomeFooter() {
  return (
    <footer className="bg-slate-50 pt-20 pb-10 border-t border-slate-200/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                <FunctionSquare className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">MathAI</span>
            </div>
            <p className="text-slate-500 max-w-sm mb-6">
              Nền tảng học Toán thông minh ứng dụng trí tuệ nhân tạo, giúp học sinh Việt Nam chinh phục mọi kỳ thi.
            </p>
            <div className="flex gap-4">
              <a className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" href="#">
                <Globe className="w-5 h-5" />
              </a>
              <a className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" href="#">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" href="#">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-slate-900">Liên kết</h4>
            <ul className="space-y-4 text-slate-500">
              <li><a className="hover:text-primary transition-colors" href="#">Về chúng tôi</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Tính năng</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Bảng giá</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Đối tác</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-slate-900">Hỗ trợ</h4>
            <ul className="space-y-4 text-slate-500">
              <li><a className="hover:text-primary transition-colors" href="#">Trung tâm trợ giúp</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Chính sách bảo mật</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Điều khoản sử dụng</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Liên hệ</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-200 text-center text-slate-500 text-sm">
          <p>© 2024 MathAI EdTech Platform. Bản quyền thuộc về Công ty TNHH Giáo dục Thông minh.</p>
        </div>
      </div>
    </footer>
  )
}

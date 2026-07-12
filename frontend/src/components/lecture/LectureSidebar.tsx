import React from 'react'
import { Download, Bookmark, BookOpen, ArrowRight } from 'lucide-react'

export default function LectureSidebar() {
  return (
    <div className="space-y-6">
      {/* Related Lessons */}
      <div className="card-premium">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <BookOpen className="text-primary" size={24} />
          Bài giảng liên quan
        </h3>
        
        <div className="space-y-4">
          {[
            { title: 'Thể tích khối lăng trụ đứng và lăng trụ xiên', category: 'Hình học lớp 12', color: 'bg-blue-100' },
            { title: 'Góc và khoảng cách trong không gian 3D', category: 'Luyện đề THPT', color: 'bg-green-100' },
            { title: 'Bài toán cực trị trong hình học không gian', category: 'Nâng cao', color: 'bg-purple-100' }
          ].map((lesson, idx) => (
            <a key={idx} className="group block cursor-pointer" href="#">
              <div className="flex gap-3">
                <div className={`w-20 h-20 shrink-0 rounded-lg ${lesson.color} overflow-hidden`}>
                </div>
                <div>
                  <h4 className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-2 text-ink">{lesson.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">{lesson.category}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
        
        <button className="w-full mt-6 text-sm font-bold text-primary hover:underline flex items-center justify-center gap-1">
          Xem tất cả bài giảng <ArrowRight size={16} />
        </button>
      </div>

      {/* Ad/Promo Card */}
      <div className="rounded-xl bg-ink p-6 text-white relative overflow-hidden group">
        <div className="relative z-10 space-y-4">
          <span className="bg-primary px-2 py-1 rounded text-xs font-bold uppercase">ƯU ĐÃI 50%</span>
          <h3 className="text-xl font-bold leading-tight">Khóa học Luyện thi THPT Quốc gia 2024</h3>
          <p className="text-slate-400 text-sm">Hệ thống bài giảng từ cơ bản đến nâng cao cùng đội ngũ giáo viên top đầu.</p>
          <button className="bg-white text-ink px-6 py-2 rounded-lg font-bold text-sm w-full hover:bg-primary hover:text-white transition-all">
            Đăng ký ngay
          </button>
        </div>
        <div className="absolute -bottom-10 -right-10 size-40 bg-primary/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  )
}

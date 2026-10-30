import React from 'react'
import { Download, Bookmark, BookOpen, ArrowRight } from 'lucide-react'

export default function LectureSidebar() {
  return (
    <div className="space-y-6">
      {/* Related Lessons */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 bg-white flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 px-2 text-primary">
            <BookOpen size={20} />
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-700">Bài giảng liên quan</h3>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
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
          
          <button className="w-full mt-6 text-sm font-bold text-primary hover:underline flex items-center justify-center gap-1">
            Xem tất cả bài giảng <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

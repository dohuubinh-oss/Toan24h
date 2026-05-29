import React from 'react';

export default function Sidebar() {
  return (
    <aside className="w-72 border-r border-slate-100 overflow-y-auto hidden md:block bg-page-bg shrink-0">
      <nav className="p-4 space-y-6">
        <div className="space-y-1">
          <a className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-all" href="#">
            <span className="material-symbols-outlined text-xl">dashboard</span>
            <span className="text-sm font-medium">Bảng điều khiển</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 bg-primary/5 text-primary rounded-lg transition-all border-r-4 border-primary" href="/questions">
            <span className="material-symbols-outlined text-xl">database</span>
            <span className="text-sm font-bold">Ngân hàng câu hỏi</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-all" href="#">
            <span className="material-symbols-outlined text-xl">assignment</span>
            <span className="text-sm font-medium">Ngân hàng đề thi</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-all" href="#">
            <span className="material-symbols-outlined text-xl">group</span>
            <span className="text-sm font-medium">Học sinh</span>
          </a>
        </div>
        
        <hr className="border-slate-100" />
        
        <div className="space-y-4">
          <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400">Bộ lọc chi tiết</h3>
          
          <details className="group px-3" open>
            <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold py-1 hover:text-primary transition-colors list-none">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-lg">school</span>
                <span>Khối lớp</span>
              </div>
              <span className="material-symbols-outlined text-sm group-open:rotate-180 transition-transform">expand_more</span>
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-2 pl-6">
              {['6', '7', '8', '9'].map(grade => (
                <label key={grade} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-primary transition-colors py-1">
                  <input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer" type="checkbox" /> Lớp {grade}
                </label>
              ))}
            </div>
          </details>

          <details className="group px-3" open>
            <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold py-1 hover:text-primary transition-colors list-none">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-lg">category</span>
                <span>Môn học</span>
              </div>
              <span className="material-symbols-outlined text-sm group-open:rotate-180 transition-transform">expand_more</span>
            </summary>
            <div className="mt-3 space-y-2 pl-6">
              {['Đại số', 'Hình học', 'Giải tích'].map(topic => (
                <label key={topic} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-primary transition-colors py-1">
                  <input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer" type="checkbox" /> {topic}
                </label>
              ))}
            </div>
          </details>

          <details className="group px-3" open>
            <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold py-1 hover:text-primary transition-colors list-none">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-lg">signal_cellular_alt</span>
                <span>Mức độ</span>
              </div>
              <span className="material-symbols-outlined text-sm group-open:rotate-180 transition-transform">expand_more</span>
            </summary>
            <div className="mt-3 space-y-2 pl-6">
              {['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'].map(diff => (
                <label key={diff} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-primary transition-colors py-1">
                  <input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer" type="checkbox" /> {diff}
                </label>
              ))}
            </div>
          </details>
        </div>
      </nav>
    </aside>
  );
}

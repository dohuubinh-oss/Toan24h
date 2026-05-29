import React from 'react'
import { Settings, X, PlusCircle, Wand2 } from 'lucide-react'

export default function QuestionSettingsSidebar() {
  return (
    <div className="space-y-6 lg:sticky lg:top-24">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
            <Settings className="text-primary w-5 h-5" />
            Thiết lập câu hỏi
          </h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Khối lớp</label>
              <select className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold focus:ring-4 focus:ring-primary/5 focus:border-primary/50 transition-all text-slate-700">
                <option>Khối 10</option>
                <option>Khối 11</option>
                <option defaultValue="Khối 12">Khối 12</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Chuyên đề</label>
              <select className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold focus:ring-4 focus:ring-primary/5 focus:border-primary/50 transition-all text-slate-700">
                <option defaultValue="Hàm số & Đồ thị">Hàm số & Đồ thị</option>
                <option>Hình học không gian</option>
                <option>Số phức</option>
                <option>Tích phân & Đạo hàm</option>
              </select>
            </div>
            
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Độ khó</label>
              <div className="grid grid-cols-2 gap-4">
                <button className="py-3.5 px-4 text-[10px] font-black rounded-xl border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all text-center uppercase tracking-widest">NHẬN BIẾT</button>
                <button className="py-3.5 px-4 text-[10px] font-black rounded-xl border-2 border-primary text-white bg-primary shadow-lg shadow-primary/20 text-center uppercase tracking-widest">THÔNG HIỂU</button>
                <button className="py-3.5 px-4 text-[10px] font-black rounded-xl border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all text-center uppercase tracking-widest">VẬN DỤNG</button>
                <button className="py-3.5 px-4 text-[10px] font-black rounded-xl border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all text-center uppercase tracking-widest">VẬN DỤNG CAO</button>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Thẻ (Tags)</label>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">
                  THPT Quốc gia
                  <button className="hover:text-blue-800"><X className="w-3.5 h-3.5" /></button>
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">
                  Khảo sát hàm số
                  <button className="hover:text-blue-800"><X className="w-3.5 h-3.5" /></button>
                </span>
              </div>
              <div className="relative">
                <input className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 pl-4 pr-10 text-sm font-medium focus:ring-4 focus:ring-primary/5 focus:border-primary/50 transition-all" placeholder="Thêm thẻ mới..." type="text" />
                <PlusCircle className="absolute right-3 top-3 text-slate-400 w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
        <div className="flex gap-4">
          <Wand2 className="text-primary w-6 h-6 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-widest">Quy trình thông minh</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              AI sẽ tự động bóc tách đề bài, chuyển đổi ký tự sang LaTeX, xác định cấp độ và gợi ý đáp án đúng cùng lời giải chỉ trong vài giây.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

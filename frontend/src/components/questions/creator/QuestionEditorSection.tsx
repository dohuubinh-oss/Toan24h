import React, { useState } from 'react'
import { 
  AlignLeft, Bold, Italic, ImagePlus, FileQuestion, 
  CheckCircle2, FileText, Info, Lightbulb, Rocket, Brain, Plus 
} from 'lucide-react'

export default function QuestionEditorSection() {
  const [isEssay, setIsEssay] = useState(false)

  return (
    <div className="space-y-6">
      {/* Shared Context Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between">
          <div className="flex items-center gap-2 px-2">
            <AlignLeft className="text-primary w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">Nội dung dẫn chung (Shared Context)</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 pr-3 border-r border-slate-300">
              <button className="p-1.5 hover:bg-white rounded transition-colors" title="Bold"><Bold className="w-4 h-4" /></button>
              <button className="p-1.5 hover:bg-white rounded transition-colors" title="Italic"><Italic className="w-4 h-4" /></button>
              <button className="p-1.5 hover:bg-white rounded transition-colors text-primary font-bold text-xs" title="LaTeX Formula">Σ</button>
              <button className="p-1.5 hover:bg-white rounded transition-colors" title="Image"><ImagePlus className="w-4 h-4" /></button>
            </div>
            <button className="text-primary text-xs font-bold hover:underline px-2 tracking-wide uppercase">Hướng dẫn</button>
          </div>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            <div className="flex flex-col gap-4">
              <div className="relative group border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center min-h-[200px] hover:border-primary/50 transition-colors cursor-pointer overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="text-center">
                    <ImagePlus className="w-10 h-10 mx-auto text-slate-300 group-hover:text-primary transition-colors" />
                    <p className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ảnh dùng chung</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <div 
                className="flex-grow min-h-[200px] focus:outline-none text-sm leading-relaxed bg-slate-50/30 p-5 rounded-xl border border-slate-200 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 overflow-y-auto" 
                contentEditable 
                data-placeholder="Nhập ngữ cảnh chung cho các câu hỏi nhỏ..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question Content Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between">
          <div className="flex items-center gap-2 px-2">
            <FileQuestion className="text-primary w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">Nội dung câu hỏi</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 pr-3 border-r border-slate-300">
              <button className="p-1.5 hover:bg-white rounded transition-colors" title="Bold"><Bold className="w-4 h-4" /></button>
              <button className="p-1.5 hover:bg-white rounded transition-colors" title="Italic"><Italic className="w-4 h-4" /></button>
              <button className="p-1.5 hover:bg-white rounded transition-colors text-primary font-bold text-xs" title="LaTeX Formula">Σ</button>
              <button className="p-1.5 hover:bg-white rounded transition-colors" title="Image"><ImagePlus className="w-4 h-4" /></button>
            </div>
            <button className="text-primary text-xs font-bold hover:underline px-2 tracking-wide uppercase">Công cụ toán</button>
          </div>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            <div className="flex flex-col gap-4">
              <div className="relative group border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center min-h-[300px] hover:border-primary/50 transition-colors cursor-pointer overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="text-center">
                    <ImagePlus className="w-12 h-12 mx-auto text-slate-300 group-hover:text-primary transition-colors" />
                    <p className="mt-3 text-xs text-slate-500 font-bold uppercase tracking-widest">Kéo thả hoặc Tải ảnh</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex-grow min-h-[300px] focus:outline-none text-base leading-relaxed bg-slate-50/30 p-6 rounded-xl border border-slate-200 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 overflow-y-auto" contentEditable>
                Cho hàm số bậc hai y = ax^2 + bx + c có đồ thị như hình vẽ bên. Tìm các giá trị của tham số m để phương trình |f(x)| = m có đúng 3 nghiệm thực phân biệt.
              </div>
              <div className="mt-3 flex items-center justify-between px-1">
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">Hỗ trợ LaTeX: $...$</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">158 KÝ TỰ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="text-primary w-6 h-6" />
            Đáp án
          </h2>
          <div className="bg-slate-100 p-1 rounded-xl flex">
            <button 
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${!isEssay ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setIsEssay(false)}
            >
              Trắc nghiệm
            </button>
            <button 
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${isEssay ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setIsEssay(true)}
            >
              Tự luận
            </button>
          </div>
        </div>
        
        {!isEssay && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {['A', 'B', 'C', 'D'].map((opt, idx) => (
              <div key={opt} className="flex items-center gap-4 group">
                <div className="flex-shrink-0">
                  <input className="w-6 h-6 text-primary border-slate-300 focus:ring-primary rounded-full" name="correct-ans" type="radio" defaultChecked={opt === 'B'} />
                </div>
                <div className={`flex-grow flex items-center rounded-xl px-5 py-4 transition-all ${opt === 'B' ? 'bg-blue-50/30 border-2 border-primary/40 ring-4 ring-primary/5' : 'bg-slate-50 border border-slate-200 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5'}`}>
                  <span className={`font-bold mr-4 ${opt === 'B' ? 'text-primary' : 'text-slate-400'}`}>{opt}.</span>
                  <input className={`bg-transparent border-none p-0 w-full focus:ring-0 text-sm ${opt === 'B' ? 'font-bold text-slate-900' : 'font-medium'}`} placeholder="Nhập đáp án..." type="text" defaultValue={idx === 0 ? 'm = 0' : idx === 1 ? 'm = 3' : idx === 2 ? 'm > 3' : '0 < m < 3'} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Solution Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between">
          <div className="flex items-center gap-2 px-2">
            <FileText className="text-primary w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">Lời giải chi tiết</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 pr-3 border-r border-slate-300">
              <button className="p-1.5 hover:bg-white rounded transition-colors" title="Bold"><Bold className="w-4 h-4" /></button>
              <button className="p-1.5 hover:bg-white rounded transition-colors" title="Italic"><Italic className="w-4 h-4" /></button>
              <button className="p-1.5 hover:bg-white rounded transition-colors text-primary font-bold text-xs" title="LaTeX Formula">Σ</button>
              <button className="p-1.5 hover:bg-white rounded transition-colors" title="Image"><ImagePlus className="w-4 h-4" /></button>
            </div>
            <button className="text-primary text-xs font-bold hover:underline px-2 tracking-wide uppercase">Hướng dẫn LaTeX</button>
          </div>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            <div className="flex flex-col gap-4">
              <div className="relative group border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center min-h-[260px] hover:border-primary/50 transition-colors cursor-pointer overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="text-center">
                    <ImagePlus className="w-10 h-10 mx-auto text-slate-300 group-hover:text-primary transition-colors" />
                    <p className="mt-2 text-xs text-slate-500 font-bold uppercase tracking-wider">Thêm ảnh minh họa lời giải</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex-grow min-h-[260px] focus:outline-none text-sm leading-relaxed bg-slate-50/30 p-5 rounded-xl border border-slate-200 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 overflow-y-auto" contentEditable>
                Đồ thị hàm số y = |f(x)| được tạo thành bằng cách giữ nguyên phần đồ thị y = f(x) nằm phía trên trục Ox và lấy đối xứng phần phía dưới qua trục Ox. <br/><br/>
                Dựa vào hình vẽ, đường thẳng y = m cắt đồ thị |f(x)| tại 3 điểm phân biệt khi và chỉ khi m = 3.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between">
          <div className="flex items-center gap-2 px-2">
            <Info className="text-primary w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">Thông tin bổ trợ cho học sinh</h2>
          </div>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> Gợi ý
            </label>
            <textarea className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 focus:ring-primary focus:border-primary text-sm font-medium placeholder:text-slate-400 min-h-[80px]" placeholder="Nhập gợi ý cho học sinh..." />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Rocket className="w-4 h-4" /> Mẹo giải nhanh
            </label>
            <textarea className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 focus:ring-primary focus:border-primary text-sm font-medium placeholder:text-slate-400 min-h-[80px]" placeholder="Nhập các mẹo giải bài nhanh..." />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Brain className="w-4 h-4" /> Phương pháp tổng quát
            </label>
            <textarea className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 focus:ring-primary focus:border-primary text-sm font-medium placeholder:text-slate-400 min-h-[80px]" placeholder="Nhập phương pháp giải tổng quát cho dạng bài này..." />
          </div>
        </div>
      </div>

      {/* Add Button */}
      <div className="flex justify-center pb-8">
        <button className="w-14 h-14 bg-white rounded-full shadow-lg border border-slate-200 flex items-center justify-center text-primary hover:scale-110 active:scale-95 transition-all group" title="Thêm câu hỏi nhỏ mới">
          <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform" />
        </button>
      </div>
    </div>
  )
}

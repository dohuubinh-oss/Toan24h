import React from 'react'
import { ListOrdered, CheckCircle2, RefreshCw, Eye, Flag, FileText, BookOpen } from 'lucide-react'

export default function ExamQuestionList() {
  return (
    <div className="lg:col-span-8 space-y-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ListOrdered className="text-primary w-6 h-6" />
          Danh sách câu hỏi (50 câu)
        </h2>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Đã kiểm tra 48/50
          </span>
        </div>
      </div>

      {/* Section 1: Trắc nghiệm */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 py-2 border-l-4 border-primary pl-4 bg-white rounded-r-xl">
          <h3 className="text-lg font-extrabold uppercase tracking-tight">Phần 1: Trắc nghiệm</h3>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">47 câu</span>
        </div>

        {/* Question 1 */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden group">
          <div className="p-5 border-b border-slate-100 flex justify-between items-start">
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-auto h-8 px-2.5 rounded-lg bg-primary text-white font-bold text-sm">Câu 1</span>
              <div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Giải tích • Vận dụng</span>
                <p className="mt-2 text-slate-800 leading-relaxed">
                  Tìm tất cả các giá trị thực của tham số <span className="latex-font">{"m"}</span> để hàm số <span className="latex-font">{"y = \\frac{1}{3}x^3 - mx^2 + (m^2 - m + 1)x + 1"}</span> đạt cực đại tại <span className="latex-font">{"x = 1"}</span>.
                </p>
              </div>
            </div>
            <button className="flex items-center justify-center gap-1 text-primary hover:bg-primary/5 px-3 h-10 rounded-lg text-sm font-medium transition-all border border-transparent hover:border-primary/20 shrink-0">
              <RefreshCw className="w-4 h-4" />
              Đổi câu hỏi khác
            </button>
          </div>
          
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50">
            <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-primary transition-colors min-h-[48px]">
              <span className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-300 text-xs font-bold">A</span>
              <span className="latex-font">{"m = 1"}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white border-2 border-primary rounded-lg cursor-pointer min-h-[48px]">
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary text-white text-xs font-bold">B</span>
              <span className="latex-font">{"m = 2"}</span>
              <CheckCircle2 className="text-primary w-5 h-5 ml-auto" />
            </div>
            <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-primary transition-colors min-h-[48px]">
              <span className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-300 text-xs font-bold">C</span>
              <span className="latex-font">{"m \\in \\{1; 2\\}"}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-primary transition-colors min-h-[48px]">
              <span className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-300 text-xs font-bold">D</span>
              <span className="latex-font">{"m \\in \\emptyset"}</span>
            </div>
          </div>
          
          <div className="px-5 py-3 bg-white border-t border-slate-100 flex items-center gap-4">
            <button className="text-xs text-slate-500 hover:text-primary flex items-center justify-center gap-1 h-10 px-2 rounded hover:bg-slate-50">
              <Eye className="w-4 h-4" /> Xem lời giải chi tiết
            </button>
            <button className="text-xs text-slate-500 hover:text-red-500 flex items-center justify-center gap-1 h-10 px-2 rounded hover:bg-slate-50">
              <Flag className="w-4 h-4" /> Báo lỗi AI
            </button>
          </div>
        </div>

        {/* Question 2 */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden group">
          <div className="p-5 border-b border-slate-100 flex justify-between items-start">
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-auto h-8 px-2.5 rounded-lg bg-primary text-white font-bold text-sm">Câu 2</span>
              <div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Hình học không gian • Thông hiểu</span>
                <p className="mt-2 text-slate-800 leading-relaxed">
                  Cho khối chóp <span className="latex-font">{"S.ABC"}</span> có đáy <span className="latex-font">{"ABC"}</span> là tam giác vuông cân tại <span className="latex-font">{"B"}</span>, <span className="latex-font">{"AB = a"}</span>. Cạnh bên <span className="latex-font">{"SA"}</span> vuông góc với mặt phẳng đáy và <span className="latex-font">{"SA = a\\sqrt{2}"}</span>. Thể tích của khối chóp đã cho bằng:
                </p>
              </div>
            </div>
            <button className="flex items-center justify-center gap-1 text-primary hover:bg-primary/5 px-3 h-10 rounded-lg text-sm font-medium transition-all border border-transparent hover:border-primary/20 shrink-0">
              <RefreshCw className="w-4 h-4" />
              Đổi câu hỏi khác
            </button>
          </div>
          
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50">
            <div className="flex items-center gap-3 p-3 bg-white border-2 border-primary rounded-lg cursor-pointer min-h-[48px]">
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary text-white text-xs font-bold">A</span>
              <span className="latex-font">{"\\frac{a^3\\sqrt{2}}{6}"}</span>
              <CheckCircle2 className="text-primary w-5 h-5 ml-auto" />
            </div>
            <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-primary transition-colors min-h-[48px]">
              <span className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-300 text-xs font-bold">B</span>
              <span className="latex-font">{"\\frac{a^3\\sqrt{2}}{3}"}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-primary transition-colors min-h-[48px]">
              <span className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-300 text-xs font-bold">C</span>
              <span className="latex-font">{"\\frac{a^3\\sqrt{2}}{2}"}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-primary transition-colors min-h-[48px]">
              <span className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-300 text-xs font-bold">D</span>
              <span className="latex-font">{"a^3\\sqrt{2}"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Tự luận */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-3 py-2 border-l-4 border-amber-500 pl-4 bg-white rounded-r-xl">
          <h3 className="text-lg font-extrabold uppercase tracking-tight">Phần 2: Tự luận</h3>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">3 câu</span>
        </div>

        {/* Question 3 */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden group">
          <div className="p-5 border-b border-slate-100 flex justify-between items-start">
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-auto h-8 px-2.5 rounded-lg bg-primary text-white font-bold text-sm">Câu 3</span>
              <div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">HÌNH HỌC KHÔNG GIAN • VẬN DỤNG CAO</span>
                <p className="mt-2 text-slate-800 leading-relaxed">
                  Cho hình chóp <span className="latex-font">{"S.ABCD"}</span> có đáy <span className="latex-font">{"ABCD"}</span> là hình vuông cạnh <span className="latex-font">{"a"}</span>. Cạnh bên <span className="latex-font">{"SA"}</span> vuông góc với đáy, <span className="latex-font">{"SA = a\\sqrt{2}"}</span>. Gọi <span className="latex-font">{"M"}</span> là trung điểm của <span className="latex-font">{"BC"}</span>. Tính khoảng cách từ điểm <span className="latex-font">{"M"}</span> đến mặt phẳng <span className="latex-font">{"(SCD)"}</span>.
                </p>
              </div>
            </div>
            <button className="flex items-center justify-center gap-1 text-primary hover:bg-primary/5 px-3 h-10 rounded-lg text-sm font-medium transition-all border border-transparent hover:border-primary/20 shrink-0">
              <RefreshCw className="w-4 h-4" />
              Đổi câu hỏi khác
            </button>
          </div>
          
          <div className="p-5 bg-slate-50/50 space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white border border-dashed border-slate-300 rounded-xl">
              <div className="flex items-center gap-2">
                <FileText className="text-amber-500 w-6 h-6" />
                <span className="text-sm font-bold text-slate-600">LOẠI CÂU HỎI: TỰ LUẬN</span>
              </div>
              <button className="flex items-center justify-center gap-2 px-4 h-12 bg-white border border-primary text-primary hover:bg-primary hover:text-white rounded-lg text-sm font-semibold transition-all">
                <BookOpen className="w-5 h-5" />
                Xem hướng dẫn chấm & Lời giải mẫu
              </button>
            </div>
          </div>
          
          <div className="px-5 py-3 bg-white border-t border-slate-100 flex items-center gap-4">
            <button className="text-xs text-slate-500 hover:text-red-500 flex items-center justify-center gap-1 h-10 px-2 rounded hover:bg-slate-50">
              <Flag className="w-4 h-4" /> Báo lỗi AI
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

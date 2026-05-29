import React from 'react'
import { Settings2, ChevronDown, Grid, Lightbulb } from 'lucide-react'

export default function ExamConfigSidebar() {
  return (
    <div className="lg:col-span-4 space-y-6">
      <div className="sticky top-24 space-y-6">
        
        {/* Cấu hình cơ bản */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <h3 className="font-bold flex items-center gap-2">
              <Settings2 className="text-primary w-5 h-5" />
              Cấu hình cơ bản
            </h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1">Tên đề thi</label>
              <input 
                className="w-full px-3 h-12 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400" 
                placeholder="Nhập tên đề thi..." 
                type="text" 
                defaultValue="Đề thi thử Toán THPTQG số 1" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 ml-1">Khối lớp</label>
                <div className="relative">
                  <select defaultValue="12" className="w-full appearance-none px-3 h-12 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer">
                    <option value="6">Lớp 6</option>
                    <option value="7">Lớp 7</option>
                    <option value="8">Lớp 8</option>
                    <option value="9">Lớp 9</option>
                    <option value="10">Lớp 10</option>
                    <option value="11">Lớp 11</option>
                    <option value="12">Lớp 12</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 ml-1">Thời gian (phút)</label>
                <div className="relative">
                  <input 
                    className="w-full px-3 h-12 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all pr-10" 
                    type="number" 
                    defaultValue="90" 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">Min</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ma trận đề thi */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <h3 className="font-bold flex items-center gap-2">
              <Grid className="text-primary w-5 h-5" />
              Ma trận đề thi
            </h3>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="py-3 font-medium">Chủ đề</th>
                  <th className="py-3 font-medium text-center">NB</th>
                  <th className="py-3 font-medium text-center">TH</th>
                  <th className="py-3 font-medium text-center">VD</th>
                  <th className="py-3 font-medium text-center">VDC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 font-medium">Hàm số</td>
                  <td className="py-3 text-center">4</td>
                  <td className="py-3 text-center">3</td>
                  <td className="py-3 text-center font-bold text-primary bg-primary/5">2</td>
                  <td className="py-3 text-center">1</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Mũ & Lo-ga</td>
                  <td className="py-3 text-center">3</td>
                  <td className="py-3 text-center">2</td>
                  <td className="py-3 text-center">1</td>
                  <td className="py-3 text-center">0</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Nguyên hàm</td>
                  <td className="py-3 text-center">3</td>
                  <td className="py-3 text-center">3</td>
                  <td className="py-3 text-center">1</td>
                  <td className="py-3 text-center">1</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Số phức</td>
                  <td className="py-3 text-center">2</td>
                  <td className="py-3 text-center">2</td>
                  <td className="py-3 text-center">1</td>
                  <td className="py-3 text-center">0</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Hình không gian</td>
                  <td className="py-3 text-center font-bold text-primary bg-primary/5">3</td>
                  <td className="py-3 text-center">2</td>
                  <td className="py-3 text-center">1</td>
                  <td className="py-3 text-center">1</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-3 font-bold">Tổng cộng</td>
                  <td className="py-3 text-center font-bold">15</td>
                  <td className="py-3 text-center font-bold">12</td>
                  <td className="py-3 text-center font-bold">12</td>
                  <td className="py-3 text-center font-bold">3</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-100 space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Độ khó: Trung bình</span>
                <span className="font-bold">6.8/10</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '68%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Gợi ý AI */}
        <div className="p-5 bg-gradient-to-br from-primary to-blue-700 rounded-2xl text-white shadow-lg shadow-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-yellow-300" />
            <h4 className="font-bold text-sm">Gợi ý từ AI</h4>
          </div>
          <p className="text-xs text-blue-100 leading-relaxed mb-4">
            Đề thi hiện tại đang thiếu câu hỏi về "Khối tròn xoay" cấp độ Vận dụng cao. Bạn có muốn bổ sung 1 câu để cân bằng ma trận?
          </p>
          <button className="w-full h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-xs font-bold transition-all">
            Tạo thêm câu hỏi
          </button>
        </div>

      </div>
    </div>
  )
}

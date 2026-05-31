import React from 'react'
import { Settings2, ChevronDown, Grid, Lightbulb } from 'lucide-react'
import { Label } from '../ui/Label'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

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
              <Label className="text-xs ml-1 mb-1">Tên đề thi</Label>
              <Input 
                placeholder="Nhập tên đề thi..." 
                defaultValue="" 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs ml-1 mb-1">Mã đề</Label>
              <Input 
                placeholder="Ví dụ: 101, MATH-01..." 
                defaultValue="" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs ml-1 mb-1">Khối lớp</Label>
                <div className="relative">
                  <select defaultValue="" className="w-full appearance-none bg-none px-3 h-12 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer">
                    <option value="" disabled>Chọn khối lớp</option>
                    <option value="5">Lớp 5</option>
                    <option value="6">Lớp 6</option>
                    <option value="7">Lớp 7</option>
                    <option value="8">Lớp 8</option>
                    <option value="9">Lớp 9</option>
                    <option value="chuyen_cap">Chuyển cấp</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs ml-1 mb-1">Thời gian (phút)</Label>
                <div className="relative">
                  <Input 
                    className="pr-10" 
                    type="number" 
                    placeholder="90" 
                    defaultValue="" 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">Min</span>
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
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
          <div className="flex gap-4">
            <Lightbulb className="text-primary w-6 h-6 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-widest">Gợi ý từ AI</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium mb-4">
                Đề thi hiện tại đang thiếu câu hỏi về "Khối tròn xoay" cấp độ Vận dụng cao. Bạn có muốn bổ sung 1 câu để cân bằng ma trận?
              </p>
              <Button className="w-full h-10 text-xs font-bold shadow-sm">
                Tạo thêm câu hỏi
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

import React from 'react'
import { Settings2, ChevronDown } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

export default function LectureBasicSettings() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 sm:p-4 bg-slate-50 border-b border-slate-200">
        <h3 className="font-bold flex items-center gap-2 text-ink">
          <Settings2 className="text-primary" size={20} />
          Cấu hình cơ bản
        </h3>
      </CardHeader>
      <CardContent className="p-5 space-y-5">
        <div className="space-y-2">
          <Label>Tên bài giảng</Label>
          <Input 
            placeholder="Nhập tên bài giảng..." 
            type="text" 
            defaultValue="Khảo sát hàm số bậc 3"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Danh mục</Label>
          <div className="relative">
            <select className="w-full px-4 h-12 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 outline-none appearance-none cursor-pointer">
              <option value="daiso">Đại số & Giải tích</option>
              <option value="hinhhoc">Hình học</option>
              <option value="thongke">Xác suất thống kê</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Khối lớp</Label>
          <div className="relative">
             <select className="w-full px-4 h-12 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 outline-none appearance-none cursor-pointer" defaultValue="12">
              <option value="10">Lớp 10</option>
              <option value="11">Lớp 11</option>
              <option value="12">Lớp 12</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

'use client'
import React from 'react'
import { Settings2, ChevronDown } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useLectureCreator } from './LectureCreatorContext'

const TOPIC_MAPPING: Record<string, string[]> = {
  "5": [
    "Phân số thập phân và hỗn số", "Số thập phân và các phép toán", "Diện tích hình tam giác, hình thang",
    "Chu vi và diện tích hình tròn", "Hình hộp chữ nhật, hình lập phương", "Hình trụ, hình cầu",
    "Đo thể tích và chuyển đổi đơn vị", "Toán chuyển động đều", "Giải toán tỉ số phần trăm"
  ],
  "6": [
    "Tập hợp số tự nhiên", "Tính chất chia hết và ước số", "Tập hợp số nguyên và phép tính",
    "Phân số bằng nhau và rút gọn", "Các phép tính với số thập phân", "Hình vuông, tam giác đều, lục giác đều",
    "Hình chữ nhật, hình thoi, hình bình hành", "Hình có trục đối xứng", "Hình có tâm đối xứng",
    "Điểm, đường thẳng, đoạn thẳng", "Trung điểm của đoạn thẳng", "Góc và số đo góc"
  ],
  "7": [
    "Tập hợp số hữu tỉ", "Căn bậc hai số học và số thực", "Tỉ lệ thức và tính chất dãy tỉ số bằng nhau",
    "Đại lượng tỉ lệ thuận, tỉ lệ nghịch", "Biểu thức đại số", "Đa thức một biến và nghiệm của đa thức",
    "Hai góc kề bù, đối đỉnh", "Dấu hiệu hai đường thẳng song song", "Tổng các góc trong một tam giác",
    "Tam giác bằng nhau (c.c.c, c.g.c, g.c.g)", "Tam giác cân và định lý Pythagoras",
    "Làm quen với xác suất của biến cố ngẫu nhiên"
  ],
  "8": [
    "Đơn thức và đa thức nhiều biến", "Các phép tính với đa thức", "Hằng đẳng thức đáng nhớ",
    "Khái niệm phân thức", "Các phép toán cộng, trừ, nhân, chia phân thức", "Khái niệm hàm số",
    "Hàm số bậc nhất y = ax + b", "Hệ số góc của đường thẳng", "Cách giải phương trình bậc nhất một ẩn",
    "Giải bài toán bằng cách lập phương trình", "Định lý Thalès thuận và đảo", "Đường trung bình của tam giác",
    "Các trường hợp đồng dạng của tam giác", "Tam giác vuông đồng dạng", "Hình chóp tam giác đều", "Hình chóp tứ giác đều"
  ],
  "9": [
    "Phương trình bậc nhất hai ẩn", "Hệ hai phương trình bậc nhất hai ẩn", "Hàm số y = ax^2 (a khác 0)",
    "Đồ thị hàm số bậc hai đơn giản", "Công thức nghiệm phương trình bậc hai", "Định lý Viète và ứng dụng",
    "Tỉ số lượng giác của góc nhọn", "Hệ thức giữa cạnh và góc", "Sự xác định đường tròn và vị trí tương đối",
    "Góc với đường tròn (Góc nội tiếp, góc ở tâm)", "Hình trụ", "Hình nón", "Hình cầu"
  ]
};

export default function LectureBasicSettings() {
  const { title, setTitle, grade, setGrade, category, setCategory } = useLectureCreator()

  return (
    <>
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Khối lớp</Label>
            <div className="relative">
              <select
                className="w-full px-4 h-12 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 outline-none appearance-none cursor-pointer"
                value={grade}
                onChange={(e) => {
                  setGrade(e.target.value)
                  setCategory('') // reset category when grade changes
                }}
              >
                <option value="" disabled>-- Chọn khối lớp --</option>
                <option value="5">Lớp 5</option>
                <option value="6">Lớp 6</option>
                <option value="7">Lớp 7</option>
                <option value="8">Lớp 8</option>
                <option value="9">Lớp 9</option>
                <option value="chuyen_cap">Chuyển cấp</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            </div>
          </div>

          {grade && (
            <div className="space-y-2">
              <Label>Chuyên đề</Label>
              <div className="relative">
                <select
                  className="w-full px-4 h-12 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 outline-none appearance-none cursor-pointer"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="" disabled>-- Chọn chuyên đề --</option>
                  {(TOPIC_MAPPING[grade] || []).length > 0 ? (
                    TOPIC_MAPPING[grade].map(topic => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))
                  ) : (
                    <option value="" disabled>Chưa có dữ liệu chuyên đề cho khối này</option>
                  )}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
              </div>
            </div>
          )}

          {grade && (
            <div className="space-y-3">
              <Label>Bài tập tự luyện</Label>
              <div className="text-sm text-slate-500 italic p-4 border border-dashed border-slate-200 rounded-lg bg-slate-50 text-center">
                Sau khi lưu bài giảng này, bạn có thể chuyển sang trang <b>Tạo đề thi</b> để chọn bài tập và liên kết với bài giảng.
              </div>
            </div>
          )}
        </CardContent>
      </Card>


    </>
  )
}

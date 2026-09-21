'use client'
import React from 'react'
import { Settings2, ChevronDown, BookOpen, PenTool } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useLectureCreator } from './LectureCreatorContext'
import { TOPIC_MAPPING, GRADES } from '@/constants/topics'

export default function LectureBasicSettings() {
  const { contentType, setContentType, title, setTitle, grade, setGrade, category, setCategory } = useLectureCreator()

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
          {/* Content Type Selector */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Loại nội dung</Label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setContentType('lecture')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  contentType === 'lecture'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Bài giảng</span>
              </button>
              <button
                type="button"
                onClick={() => setContentType('practice')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  contentType === 'practice'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Luyện tập / Đề</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{contentType === 'practice' ? 'Tiêu đề Card Luyện tập / Đề kiểm tra' : 'Tên bài giảng'}</Label>
            <Input
              placeholder={contentType === 'practice' ? "VD: Ôn tập Chương 1, Đề kiểm tra 15 phút..." : "Nhập tên bài giảng..."}
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
              <div className="text-sm text-slate-500 italic p-4 border border-dashed border-slate-200 rounded-lg bg-slate-50 text-center leading-relaxed">
                Sau khi lưu bài giảng, bạn có thể vào <b>Ngân hàng câu hỏi</b> để chọn các câu hỏi phù hợp và tạo bài tập / đề thi liên kết.
              </div>
            </div>
          )}
        </CardContent>
      </Card>


    </>
  )
}

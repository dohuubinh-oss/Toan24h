'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Settings2, ChevronDown, CheckSquare, Square, Plus, Trash2, X } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useLectureCreator } from './LectureCreatorContext'
import { fetchPracticesByGrade } from '@/data/mockPracticeData'
import { Practice } from '@/types/practice'

export default function LectureBasicSettings() {
  const { title, setTitle, grade, setGrade, category, setCategory, practiceIds, setPracticeIds } = useLectureCreator()
  const [availablePractices, setAvailablePractices] = useState<Practice[]>([])
  const [isLoadingPractices, setIsLoadingPractices] = useState(false)
  const [isBankModalOpen, setIsBankModalOpen] = useState(false)

  useEffect(() => {
    if (grade) {
      setIsLoadingPractices(true)
      fetchPracticesByGrade(grade, 1, 100)
        .then(res => {
          setAvailablePractices(res.practices)
          // clear invalid practiceIds
          const validIds = res.practices.map(p => p.id)
          setPracticeIds(practiceIds.filter(id => validIds.includes(id)))
        })
        .catch(console.error)
        .finally(() => setIsLoadingPractices(false))
    } else {
      setAvailablePractices([])
    }
  }, [grade])

  const togglePractice = (id: string) => {
    if (practiceIds.includes(id)) {
      setPracticeIds(practiceIds.filter(pId => pId !== id))
    } else {
      setPracticeIds([...practiceIds, id])
    }
  }

  const selectedPractices = availablePractices.filter(p => practiceIds.includes(p.id))

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
                <option value="onthi">Ôn thi</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            </div>
          </div>

          {grade && (
            <div className="space-y-2">
              <Label>Danh mục</Label>
              <div className="relative">
                <select
                  className="w-full px-4 h-12 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 outline-none appearance-none cursor-pointer"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="" disabled>-- Chọn danh mục --</option>
                  <option value="daiso">Đại số & Giải tích</option>
                  <option value="hinhhoc">Hình học</option>
                  <option value="thongke">Xác suất thống kê</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
              </div>
            </div>
          )}

          {grade && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Bài tập</Label>
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(true)}
                  className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 px-2.5 py-1 rounded-md"
                >
                  <Plus size={16} /> Thêm
                </button>
              </div>

              {selectedPractices.length > 0 ? (
                <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 space-y-1">
                  {selectedPractices.map(practice => (
                    <div
                      key={practice.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-md bg-white border border-slate-100 shadow-sm"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800 leading-tight">{practice.title}</p>
                        <p className="text-xs text-slate-500 mt-1">ID: {practice.id} • {practice.questionCount} câu hỏi</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => togglePractice(practice.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Xóa bài tập"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500 italic p-3 border border-dashed border-slate-200 rounded-lg bg-slate-50 text-center">
                  Chưa có bài tập nào được chọn
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Ngân hàng câu hỏi */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Ngân hàng câu hỏi - Lớp {grade}</h3>
              <div className="flex items-center gap-2">
                <Link 
                  href="/dashboard/questions" 
                  target="_blank" 
                  className="px-3 py-1.5 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-1 shadow-sm"
                >
                  <Plus size={16} /> Thêm bài tập
                </Link>
                <button 
                  onClick={() => setIsBankModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {isLoadingPractices ? (
                <div className="py-8 text-center text-slate-500">Đang tải danh sách bài tập...</div>
              ) : availablePractices.length === 0 ? (
                <div className="py-8 text-center text-slate-500">Không có bài tập nào cho khối lớp này.</div>
              ) : (
                <div className="space-y-2">
                  {availablePractices.map(practice => (
                    <div
                      key={practice.id}
                      onClick={() => togglePractice(practice.id)}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-all"
                    >
                      <div className="mt-0.5 text-primary">
                        {practiceIds.includes(practice.id) ? (
                          <CheckSquare size={20} />
                        ) : (
                          <Square size={20} className="text-slate-300" />
                        )}
                      </div>
                      <div>
                        <p className="text-[15px] font-medium text-slate-800 leading-tight">{practice.title}</p>
                        <p className="text-xs text-slate-500 mt-1">ID: {practice.id} • {practice.questionCount} câu hỏi</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end">
              <button
                onClick={() => setIsBankModalOpen(false)}
                className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

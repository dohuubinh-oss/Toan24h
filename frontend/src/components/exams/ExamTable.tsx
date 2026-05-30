import React from 'react'
import { Calculator, Share2, Copy, Edit2, Trash2 } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export type ExamType = 'Giữa kỳ' | 'Cuối kỳ' | 'Chuyên'

export interface Exam {
  id: string
  title: string
  grade: number
  questionCount: number
  duration: number
  examType: ExamType
  updatedAt: string
}

interface ExamTableProps {
  exams: Exam[]
}

export default function ExamTable({ exams }: ExamTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên đề thi</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Khối lớp</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Số câu hỏi</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Thời gian</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Loại đề</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {exams.map(exam => (
              <tr key={exam.id} className="hover:bg-slate-50 transition-colors group relative border-l-2 border-transparent hover:border-primary">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{exam.title}</p>
                      <p className="text-xs text-slate-400">Cập nhật {exam.updatedAt}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm font-medium text-slate-700">Lớp {exam.grade}</span>
                </td>
                <td className="px-6 py-4 text-center text-sm font-medium">{exam.questionCount}</td>
                <td className="px-6 py-4 text-center text-sm font-medium">{exam.duration} phút</td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-slate-700">{exam.examType}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-11 w-11 text-slate-400 hover:text-primary" title="Chỉnh sửa">
                      <Edit2 className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-11 w-11 text-slate-400 hover:text-red-500 hover:bg-red-50" title="Xóa">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {exams.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Calculator className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-base font-semibold text-slate-700">Không tìm thấy đề thi</p>
                    <p className="text-sm mt-1">Hãy thử thay đổi bộ lọc hoặc từ khoá tìm kiếm.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

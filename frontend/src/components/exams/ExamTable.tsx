import React from 'react'
import { Calculator, Share2, Copy, Edit2, Trash2 } from 'lucide-react'

export type ExamStatus = 'Published' | 'Draft' | 'Ended'

export interface Exam {
  id: string
  title: string
  grade: number
  questionCount: number
  duration: number
  status: ExamStatus
  updatedAt: string
}

interface ExamTableProps {
  exams: Exam[]
}

export default function ExamTable({ exams }: ExamTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên đề thi</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Khối lớp</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Số câu hỏi</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Thời gian</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {exams.map(exam => (
              <tr key={exam.id} className="hover:bg-slate-50 transition-colors group">
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
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">Lớp {exam.grade}</span>
                </td>
                <td className="px-6 py-4 text-center text-sm font-medium">{exam.questionCount}</td>
                <td className="px-6 py-4 text-center text-sm font-medium">{exam.duration} phút</td>
                <td className="px-6 py-4">
                  {exam.status === 'Published' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                      Đã xuất bản
                    </span>
                  )}
                  {exam.status === 'Draft' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
                      Nháp
                    </span>
                  )}
                  {exam.status === 'Ended' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
                      Đã kết thúc
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Chia sẻ">
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Nhân bản">
                      <Copy className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Chỉnh sửa">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Xóa">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

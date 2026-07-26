import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calculator, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '../ui/Button'

export type ExamType = 'Giữa kỳ' | 'Cuối kỳ' | 'Chuyên'

export interface Exam {
  id: string
  title: string
  grade: number | string
  questionIds?: string[]
  duration: number
  cate?: string
  type?: string
  examCode?: string
  diffScore?: number
  createdAt?: string
  updatedAt?: string
}

interface ExamTableProps {
  exams: Exam[]
  onDelete?: (id: string) => void
}

type SortOrder = 'asc' | 'desc' | null;

export default function ExamTable({ exams, onDelete }: ExamTableProps) {
  const router = useRouter()
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  const handleSort = () => {
    if (sortOrder === null) setSortOrder('asc');
    else if (sortOrder === 'asc') setSortOrder('desc');
    else setSortOrder(null);
  };

  const sortedExams = [...exams].sort((a, b) => {
    if (sortOrder === null) return 0;
    const diffA = a.diffScore || 0;
    const diffB = b.diffScore || 0;
    return sortOrder === 'asc' ? diffA - diffB : diffB - diffA;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-[40%]">Tên đề thi</th>
              <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">Khối lớp</th>
              <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">Số câu hỏi</th>
              <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">Thời gian</th>
              <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">Phân loại</th>
              <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">Loại đề</th>
              <th 
                className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                onClick={handleSort}
              >
                <div className="flex items-center justify-center gap-1">
                  Độ khó
                  {sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : sortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUpDown className="w-3 h-3" />}
                </div>
              </th>
              <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedExams.map(exam => (
              <tr 
                key={exam.id} 
                onClick={() => router.push(`/exam/${exam.id}/take`)}
                className="hover:bg-slate-50 transition-colors group relative border-l-2 border-transparent hover:border-primary cursor-pointer"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-primary/10 flex flex-shrink-0 items-center justify-center text-primary">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{exam.title}</p>
                      <p className="text-xs text-slate-400">Mã đề: {exam.examCode || 'N/A'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-center whitespace-nowrap">
                  <span className="text-sm font-medium text-slate-700">Lớp {exam.grade}</span>
                </td>
                <td className="px-3 py-3 text-center text-sm font-medium whitespace-nowrap">{exam.questionIds?.length || 0}</td>
                <td className="px-3 py-3 text-center text-sm font-medium whitespace-nowrap">{exam.duration} phút</td>
                <td className="px-3 py-3 text-center whitespace-nowrap">
                  <span className="text-sm font-medium text-slate-700">{exam.cate === 'practice' ? 'Bài tập' : 'Đề thi'}</span>
                </td>
                <td className="px-3 py-3 text-center whitespace-nowrap">
                  <span className="text-sm font-medium text-slate-700">{exam.type || '-'}</span>
                </td>
                <td className="px-3 py-3 text-center whitespace-nowrap">
                  <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">{Number(exam.diffScore || 0).toFixed(1)}</span>
                </td>
                <td className="px-3 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50" 
                      title="Xóa"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDelete) onDelete(exam.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {sortedExams.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center">
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

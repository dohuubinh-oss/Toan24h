import React from 'react'
import { Settings2, ChevronDown, Grid, Lightbulb } from 'lucide-react'
import { Label } from '../ui/Label'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Exam } from '../../types/exam'
import { Question } from '../../types/question'

interface ExamConfigSidebarProps {
  config: Partial<Exam>;
  onChange: (field: keyof Exam, value: any) => void;
  questions: Question[];
}

export default function ExamConfigSidebar({ config, onChange, questions }: ExamConfigSidebarProps) {
  // Calculate matrix based on questions
  const matrix = questions.reduce((acc, q) => {
    const topic = q.topic || 'Chưa phân loại';
    if (!acc[topic]) {
      acc[topic] = { NB: 0, TH: 0, VD: 0, VDC: 0 };
    }
    if (q.difficulty_level === 'Nhận biết') acc[topic].NB++;
    else if (q.difficulty_level === 'Thông hiểu') acc[topic].TH++;
    else if (q.difficulty_level === 'Vận dụng') acc[topic].VD++;
    else if (q.difficulty_level === 'Vận dụng cao') acc[topic].VDC++;
    return acc;
  }, {} as Record<string, { NB: number; TH: number; VD: number; VDC: number }>);

  const topics = Object.keys(matrix);
  const totalNB = topics.reduce((sum, t) => sum + matrix[t].NB, 0);
  const totalTH = topics.reduce((sum, t) => sum + matrix[t].TH, 0);
  const totalVD = topics.reduce((sum, t) => sum + matrix[t].VD, 0);
  const totalVDC = topics.reduce((sum, t) => sum + matrix[t].VDC, 0);

  // Difficulty calculation heuristic: NB=1, TH=2, VD=3, VDC=4
  const totalQuestions = questions.length || 1;
  const avgDifficulty = ((totalNB * 1) + (totalTH * 2) + (totalVD * 3) + (totalVDC * 4)) / totalQuestions;
  // Map 1-4 scale to 1-10 scale
  const diffScore = ((avgDifficulty - 1) / 3) * 10;
  const diffLabel = diffScore < 4 ? 'Dễ' : diffScore < 7 ? 'Trung bình' : 'Khó';

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
                value={config.title || ''}
                onChange={(e) => onChange('title', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs ml-1 mb-1">Mã đề</Label>
              <Input 
                placeholder="Ví dụ: 101, MATH-01..." 
                value={config.examCode || ''}
                onChange={(e) => onChange('examCode', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs ml-1 mb-1">Khối lớp</Label>
                <div className="relative">
                  <select 
                    value={config.grade || ''} 
                    onChange={(e) => onChange('grade', e.target.value)}
                    className="w-full appearance-none bg-none px-3 h-12 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                  >
                    <option value="" disabled>Chọn khối lớp</option>
                    <option value="5">Lớp 5</option>
                    <option value="6">Lớp 6</option>
                    <option value="7">Lớp 7</option>
                    <option value="8">Lớp 8</option>
                    <option value="9">Lớp 9</option>
                    <option value="12">Lớp 12</option>
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
                    value={config.duration || ''}
                    onChange={(e) => onChange('duration', parseInt(e.target.value) || 0)}
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
                {topics.length > 0 ? (
                  topics.map((topic, i) => (
                    <tr key={i}>
                      <td className="py-3 font-medium">{topic}</td>
                      <td className="py-3 text-center">{matrix[topic].NB}</td>
                      <td className="py-3 text-center">{matrix[topic].TH}</td>
                      <td className="py-3 text-center">{matrix[topic].VD}</td>
                      <td className="py-3 text-center">{matrix[topic].VDC}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400">Chưa có dữ liệu</td>
                  </tr>
                )}
                
                {topics.length > 0 && (
                  <tr className="bg-slate-50">
                    <td className="py-3 font-bold">Tổng cộng</td>
                    <td className="py-3 text-center font-bold">{totalNB}</td>
                    <td className="py-3 text-center font-bold">{totalTH}</td>
                    <td className="py-3 text-center font-bold">{totalVD}</td>
                    <td className="py-3 text-center font-bold">{totalVDC}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-100 space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Độ khó: {diffLabel}</span>
                <span className="font-bold">{diffScore.toFixed(1)}/10</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, diffScore * 10))}%` }}></div>
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
                Ma trận đề thi hiện tại đang được tính toán trực tiếp từ dữ liệu câu hỏi. Bạn có thể thay đổi cấu trúc câu hỏi để ma trận cân bằng hơn.
              </p>
              <Button className="w-full h-12 text-sm font-bold shadow-sm">
                Tạo thêm câu hỏi
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

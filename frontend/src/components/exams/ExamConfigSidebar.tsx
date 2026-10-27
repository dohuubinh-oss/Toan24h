import React from 'react'
import { Settings2, ChevronDown, Grid, Lightbulb } from 'lucide-react'
import { Label } from '../ui/Label'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Exam } from '../../types/exam'
import { Question } from '../../types/question'
import { calculateExamDifficulty } from '../../lib/exam-utils'
import { cn } from '../../lib/utils'
import LectureSelectorModal from './LectureSelectorModal'

interface ExamConfigSidebarProps {
  config: Partial<Exam>;
  onChange: (field: keyof Exam, value: any) => void;
  questions: Question[];
  errors?: Record<string, string>;
}

export default function ExamConfigSidebar({ config, onChange, questions, errors = {} }: ExamConfigSidebarProps) {
  const { diffScore, matrix, diffLabel, totalNB, totalTH, totalVD, totalVDC } = calculateExamDifficulty(questions);
  const topics = Object.keys(matrix);
  const [isLectureModalOpen, setIsLectureModalOpen] = React.useState(false);
  const [selectedLectureName, setSelectedLectureName] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (config.lectureId) {
      import('@/lib/lectureApi').then(({ getLectureById }) => {
        getLectureById(config.lectureId!).then(lecture => {
          if (lecture && lecture.title) {
            setSelectedLectureName(lecture.title);
          }
        }).catch(err => console.error("Failed to load lecture title:", err));
      });
    } else {
      setSelectedLectureName(null);
    }
  }, [config.lectureId]);

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
              <Label className="text-xs ml-1 mb-1" htmlFor="exam-title">Tên đề thi</Label>
              <Input 
                id="exam-title"
                placeholder="Nhập tên đề thi..." 
                value={config.title || ''}
                onChange={(e) => onChange('title', e.target.value)}
                error={!!errors.title}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1 font-medium ml-1">{errors.title}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs ml-1 mb-1" htmlFor="exam-code">Mã đề</Label>
              <Input 
                id="exam-code"
                placeholder="Ví dụ: 101, MATH-01..." 
                value={config.examCode || ''}
                onChange={(e) => onChange('examCode', e.target.value)}
                error={!!errors.examCode}
              />
              {errors.examCode && <p className="text-red-500 text-xs mt-1 font-medium ml-1">{errors.examCode}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs ml-1 mb-1">Phân loại</Label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => onChange('cate', 'exam')}
                  className={cn(
                    "flex-1 py-2.5 text-sm font-medium rounded-lg transition-all",
                    (!config.cate || config.cate === 'exam') 
                      ? "bg-white text-primary shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Đề thi
                </button>
                <button
                  type="button"
                  onClick={() => onChange('cate', 'practice')}
                  className={cn(
                    "flex-1 py-2.5 text-sm font-medium rounded-lg transition-all",
                    config.cate === 'practice' 
                      ? "bg-white text-indigo-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Bài tập
                </button>
              </div>
            </div>
            {(!config.cate || config.cate === 'exam') && (
              <div className="space-y-1.5">
                <Label className="text-xs ml-1 mb-1" htmlFor="exam-type">Loại đề</Label>
                <div className="relative">
                  <select 
                    id="exam-type"
                    value={config.type || ''} 
                    onChange={(e) => onChange('type', e.target.value)}
                    className={cn(
                      "w-full appearance-none bg-none px-3 h-12 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer",
                      errors.type ? "border-red-500" : "border-slate-200"
                    )}
                  >
                    <option value="" disabled>Chọn loại đề</option>
                    <option value="Giữa kì 1">Giữa kì 1</option>
                    <option value="Cuối kì 1">Cuối kì 1</option>
                    <option value="Giữa kì 2">Giữa kì 2</option>
                    <option value="Cuối kì 2">Cuối kì 2</option>
                    <option value="Chuyên Đề">Chuyên Đề</option>
                    <option value="Ôn tập">Ôn tập</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5" />
                </div>
                {errors.type && <p className="text-red-500 text-xs mt-1 font-medium ml-1">{errors.type}</p>}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs ml-1 mb-1" htmlFor="exam-grade">Khối lớp</Label>
                <div className="relative">
                  <select 
                    id="exam-grade"
                    value={config.grade || ''} 
                    onChange={(e) => onChange('grade', e.target.value)}
                    className={cn(
                      "w-full appearance-none bg-none px-3 h-12 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer",
                      errors.grade ? "border-red-500" : "border-slate-200"
                    )}
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
                {errors.grade && <p className="text-red-500 text-xs mt-1 font-medium ml-1">{errors.grade}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs ml-1 mb-1" htmlFor="exam-duration">Thời gian (phút)</Label>
                <div className="relative">
                  <Input 
                    id="exam-duration"
                    className="pr-10" 
                    type="number" 
                    placeholder={config.cate === 'practice' ? "--" : "90"} 
                    value={config.cate === 'practice' ? '' : (config.duration || '')}
                    onChange={(e) => onChange('duration', parseInt(e.target.value) || 0)}
                    error={!!errors.duration}
                    disabled={config.cate === 'practice'}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">Min</span>
                </div>
                {errors.duration && <p className="text-red-500 text-xs mt-1 font-medium ml-1">{errors.duration}</p>}
              </div>
            </div>
            
            {/* Lựa chọn bài giảng (cho cả đề thi và bài tập) */}
            <div className="space-y-1.5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <Label className="text-xs ml-1 mb-1">Liên kết bài giảng</Label>
                {config.lectureId && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange('lectureId', null)
                      setSelectedLectureName(null)
                    }}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors font-medium cursor-pointer"
                  >
                    Gỡ liên kết
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <div 
                  className={cn(
                    "flex-1 px-3 py-2 bg-slate-50 border rounded-xl text-sm truncate flex items-center transition-colors",
                    selectedLectureName ? "text-slate-800 font-medium border-slate-200" : "text-slate-400 italic border-slate-200"
                  )}
                  title={selectedLectureName || "Chưa liên kết bài giảng"}
                >
                  {selectedLectureName ? selectedLectureName : "Chưa liên kết bài giảng"}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-shrink-0"
                  onClick={() => setIsLectureModalOpen(true)}
                >
                  {selectedLectureName ? "Đổi" : "Chọn"}
                </Button>
              </div>
              <p className="text-[11px] text-slate-500 ml-1 leading-relaxed">
                Liên kết đề thi với bài giảng (ví dụ: &quot;Kiểm tra giữa kì 1&quot;) để học sinh làm bài trực tiếp từ bài giảng tương ứng.
              </p>
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

      <LectureSelectorModal
        isOpen={isLectureModalOpen}
        onClose={() => setIsLectureModalOpen(false)}
        onSelect={(lecture) => {
          onChange('lectureId', lecture.id)
          setSelectedLectureName(lecture.title)
        }}
        grade={config.grade}
      />
    </div>
  )
}

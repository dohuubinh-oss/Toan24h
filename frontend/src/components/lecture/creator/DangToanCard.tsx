import React, { useState } from 'react'
import { Microscope, Plus, Trash2, ChevronDown, ChevronRight, GripVertical, CheckCircle2, Pencil } from 'lucide-react'
import { Button } from '../../ui/Button'
import SharedEditorCard from '@/components/questions/creator/editor/SharedEditorCard'
import RichTextEditor from '@/components/questions/creator/editor/RichTextEditor'
import { DangToanItem, MethodItem, ExampleExercise, ExampleStep } from './LectureCreatorContext'
import AiLectureExtractModal from './AiLectureExtractModal'
import { parseLectureJson } from './utils/lectureJsonParser'
import { toast } from '@/components/ui/ToastProvider'

interface DangToanCardProps {
  dangToan: DangToanItem;
  index: number;
  onChange: (dt: DangToanItem) => void;
  onRemove?: () => void;
}

function MethodCard({ method, index, onChange, onRemove }: { method: MethodItem, index: number, onChange: (m: MethodItem) => void, onRemove?: () => void }) {
  const [isExpanded, setIsExpanded] = useState(true)

  const exercise = method.exercise || { content: '' }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white mb-4">
      <div 
        className="flex items-center justify-between p-3 bg-white cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
          <span className="font-bold text-slate-700">Phương pháp {index + 1}</span>
        </div>
        {onRemove && (
          <Button
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="p-5 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div>
              <SharedEditorCard
                title="Nội dung phương pháp"
                icon={<></>}
                content={method.solution || ''}
                onContentChange={(html) => onChange({ ...method, solution: html })}
                placeholder="VD: Đơn thức là biểu thức..."
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <div className="flex flex-col gap-6">
              <SharedEditorCard
                title="BÀI TẬP MẪU"
                icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
                content={exercise.content || ''}
                onContentChange={(html) => onChange({ ...method, exercise: { content: html } })}
                placeholder="Nhập nội dung bài tập (Đề bài và Các bước giải)..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DangToanCard({
  dangToan,
  index,
  onChange,
  onRemove,
}: DangToanCardProps) {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)

  const handleAiExtracted = (jsonString: string) => {
    try {
      const parsedList = parseLectureJson(jsonString)
      if (parsedList.length === 0) {
        toast.error('Không tìm thấy dữ liệu Dạng toán trong ảnh')
        return
      }
      const extracted = parsedList[0]
      onChange({
        ...extracted,
        id: dangToan.id,
      })
      toast.success(`Đã cập nhật Dạng toán ${index + 1} thành công từ ảnh!`)
      setIsAiModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xử lý dữ liệu từ ảnh')
    }
  }
  
  const updateMethod = (methodId: string, updated: MethodItem) => {
    onChange({
      ...dangToan,
      methods: dangToan.methods.map(m => m.id === methodId ? updated : m)
    })
  }

  const addMethod = () => {
    onChange({
      ...dangToan,
      methods: [
        ...dangToan.methods,
        {
          id: Math.random().toString(36).substr(2, 9),
          methodName: '',
          solution: '',
          exercise: null,
          problemImage: null,
          solutionImage: null
        }
      ]
    })
  }

  const removeMethod = (methodId: string) => {
    onChange({
      ...dangToan,
      methods: dangToan.methods.filter(m => m.id !== methodId)
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-4 bg-white flex flex-wrap items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2 px-2">
          <Microscope className="text-primary w-5 h-5 shrink-0" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">Dạng Toán {index + 1}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setIsAiModalOpen(true)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2"
            title="Sửa Dạng Toán từ ảnh bằng AI"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          {onRemove && (
            <Button
              variant="ghost"
              onClick={onRemove}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2"
              title="Xóa Dạng Toán"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="p-6 flex-grow flex flex-col gap-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Tên Dạng Toán</label>
          <div className="w-full min-h-[44px] px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-colors flex items-center">
            <RichTextEditor
              inline={true}
              hideToolbar={true}
              showMathButton={true}
              placeholder="VD: Dạng 1: Rút gọn biểu thức $A = \sqrt{x} + 1$..."
              content={dangToan.mathType || ''}
              onChange={(val) => onChange({ ...dangToan, mathType: val })}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="font-bold text-slate-700 mb-2">Các phương pháp giải</h4>
          {dangToan.methods.map((method, mIdx) => (
            <MethodCard 
              key={method.id} 
              method={method} 
              index={mIdx}
              onChange={(updated) => updateMethod(method.id, updated)}
              onRemove={dangToan.methods.length > 1 ? () => removeMethod(method.id) : undefined}
            />
          ))}

          <Button
            variant="outline"
            onClick={addMethod}
            className="w-full border-dashed border-2 border-slate-200 text-slate-500 hover:border-primary hover:text-primary hover:bg-primary/5 h-12 rounded-xl mt-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm phương pháp giải (Cùng Dạng toán)
          </Button>
        </div>
      </div>

      <AiLectureExtractModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onExtracted={handleAiExtracted}
        title={`Bóc tách & Cập nhật Dạng toán ${index + 1} bằng AI`}
        description="Tự động nhận diện nội dung dạng toán, phương pháp giải và ví dụ mẫu từ ảnh để cập nhật cho dạng toán này"
      />
    </div>
  )
}

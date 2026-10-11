import React, { useRef, useState } from 'react'
import { Microscope, ImagePlus, Plus, Trash2, ChevronDown, ChevronRight, GripVertical, CheckCircle2 } from 'lucide-react'
import { Button } from '../../ui/Button'
import MathText from '@/components/ui/MathText'
import SharedEditorCard from '@/components/questions/creator/editor/SharedEditorCard'
import { DangToanItem, MethodItem, ExampleExercise, ExampleStep } from './LectureCreatorContext'

interface DangToanCardProps {
  dangToan: DangToanItem;
  index: number;
  onChange: (dt: DangToanItem) => void;
  onRemove?: () => void;
}

function ImageUploadArea({ 
  imageUrl, 
  onChange, 
  label 
}: { 
  imageUrl?: string | null; 
  onChange: (url: string | null) => void; 
  label: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      onChange(url)
    }
  }

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-bold text-slate-700">{label}</h3>
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />
      <div 
        onClick={handleImageClick}
        className={`relative group border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center min-h-[150px] hover:border-primary/50 transition-colors cursor-pointer overflow-hidden ${imageUrl ? 'bg-white' : 'bg-slate-50/50'}`}
      >
        {imageUrl ? (
          <>
            <img src={imageUrl} alt="Uploaded" className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
              <button 
                onClick={handleRemoveImage}
                className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors text-sm shadow-md transform scale-95 group-hover:scale-100"
              >
                Xóa ảnh
              </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="text-center">
              <ImagePlus className="w-8 h-8 mx-auto text-slate-300 group-hover:text-primary transition-colors" />
              <p className="mt-2 text-xs text-slate-500 font-bold uppercase tracking-widest">Tải ảnh lên</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
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
                content={method.methodContent || ''}
                onContentChange={(html) => onChange({ ...method, methodContent: html })}
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
          methodContent: '',
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
      <div className="p-4 bg-white flex flex-wrap items-center justify-between">
        <div className="flex items-center gap-2 px-2">
          <Microscope className="text-primary w-5 h-5" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">Dạng Toán {index + 1}</h2>
        </div>
        <div className="flex items-center gap-2">
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
          <input
            type="text"
            placeholder="VD: Nhận biết đơn thức..."
            value={dangToan.dangToanName}
            onChange={(e) => onChange({ ...dangToan, dangToanName: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-primary/50 transition-colors"
          />
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
    </div>
  )
}

import React, { useRef, useState } from 'react'
import { Microscope, ImagePlus, Code, Plus, Trash2, ChevronDown, ChevronRight, GripVertical } from 'lucide-react'
import { Button } from '../../ui/Button'
import MathText from '@/components/ui/MathText'
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [jsonInput, setJsonInput] = useState('')
  const [jsonError, setJsonError] = useState('')

  const handleSaveJson = () => {
    try {
      setJsonError('')
      const parsed = JSON.parse(jsonInput)
      
      let newExercise = method.exercise ? { ...method.exercise } : { problem: '', steps: [] }
      const stepsData = parsed.Steps || parsed.steps;
      
      if (stepsData && Array.isArray(stepsData)) {
        newExercise.steps = stepsData;
        if (parsed.conclusion !== undefined) {
          newExercise.conclusion = parsed.conclusion;
        }
        if (parsed.problem !== undefined) {
          newExercise.problem = parsed.problem;
        }
        if (parsed.tips !== undefined) {
          newExercise.tips = parsed.tips;
        }
      } else if (parsed.exercise) {
        newExercise = { ...newExercise, ...parsed.exercise }
      } else {
        throw new Error('JSON cần chứa mảng "Steps" (hoặc "steps").')
      }

      onChange({ ...method, exercise: newExercise })
      setIsModalOpen(false)
      setJsonInput('')
    } catch (e: any) {
      setJsonError('JSON không hợp lệ: ' + e.message)
    }
  }

  const exercise = method.exercise

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white mb-4">
      <div 
        className="flex items-center justify-between p-3 bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tên Phương pháp giải</label>
              <input
                type="text"
                placeholder="VD: Sử dụng định nghĩa..."
                value={method.methodName}
                onChange={(e) => onChange({ ...method, methodName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nội dung phương pháp</label>
              <input
                type="text"
                placeholder="VD: Đơn thức là biểu thức..."
                value={method.methodContent}
                onChange={(e) => onChange({ ...method, methodContent: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-700">Bài tập (Đề bài & Lời giải)</h4>
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(true)}
                className="border-slate-300 hover:border-primary hover:text-primary transition-colors text-xs h-8 px-3"
              >
                <Code className="w-3 h-3 mr-1.5" />
                Nhập JSON
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              {/* Left Column: Images */}
              <div className="flex flex-col gap-4">
                <ImageUploadArea 
                  imageUrl={method.problemImage} 
                  onChange={(url) => onChange({ ...method, problemImage: url })} 
                  label="1. Ảnh Đề Bài" 
                />
                <ImageUploadArea 
                  imageUrl={method.solutionImage} 
                  onChange={(url) => onChange({ ...method, solutionImage: url })} 
                  label="2. Ảnh Lời Giải" 
                />
              </div>

              {/* Right Column: Preview */}
              <div className="flex flex-col h-full rounded-xl border border-slate-200 bg-slate-50/50 p-5 overflow-y-auto min-h-[300px] max-h-[600px]">
                {!exercise || (!exercise.problem && (!exercise.steps || exercise.steps.length === 0)) ? (
                  <div className="flex-grow flex items-center justify-center text-slate-400 italic">
                    Chưa có nội dung. Hãy nhập bằng JSON.
                  </div>
                ) : (
                  <div className="space-y-6 w-full">
                    {exercise.problem && (
                      <div className="pb-4 border-b border-slate-200">
                        <h4 className="font-bold text-slate-700 mb-2">Đề bài</h4>
                        <MathText content={exercise.problem} className="text-slate-800" />
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-700 mb-2">Các bước giải</h4>
                      {exercise.steps?.map((step) => (
                        <div className="flex gap-4" key={step.step}>
                          <div className="flex-none flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                              {step.step}
                            </div>
                            <div className="w-0.5 h-full bg-slate-200 my-1"></div>
                          </div>
                          <div className="pb-4">
                            <MathText content={step.title} className="font-bold text-slate-800 text-base" />
                            <MathText content={step.content} className="text-slate-600 mt-1" />
                            {step.formula && <MathText content={step.formula.includes('$') ? step.formula : `$$${step.formula}$$`} className="mt-2 text-primary font-bold" />}
                          </div>
                        </div>
                      ))}

                      {exercise.conclusion && (
                        <div className="flex gap-4 mt-4">
                          <div className="flex-none flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
                              ✓
                            </div>
                          </div>
                          <div className="pb-4 pt-1">
                            <h4 className="font-bold text-green-600">Kết luận</h4>
                            <MathText content={exercise.conclusion} className="text-slate-600 mt-1" />
                          </div>
                        </div>
                      )}

                      {exercise.tips && (
                        <div className="flex gap-4 mt-4">
                          <div className="flex-none flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                              💡
                            </div>
                          </div>
                          <div className="pb-4 pt-1">
                            <h4 className="font-bold text-amber-600">Mẹo giải / Gợi ý</h4>
                            <MathText content={exercise.tips} className="text-slate-600 mt-1" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JSON Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                Nhập JSON
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full h-64 p-4 rounded-xl border border-slate-200 font-mono text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none whitespace-pre"
                placeholder={`{
  "problem": "Nội dung đề bài (hỗ trợ LaTex với cặp $$)",
  "steps": [
    {
      "step": 1,
      "title": "Bước 1",
      "content": "Nội dung diễn giải",
      "formula": "x = 1"
    }
  ],
  "conclusion": "Vậy x = 1 là nghiệm",
  "tips": "Nhớ đặt điều kiện trước khi giải nhé!"
}`}
              />
              {jsonError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                  <div className="text-red-500 text-sm">{jsonError}</div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-600 hover:bg-slate-200"
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveJson}
                className="bg-primary hover:bg-primary-dark text-white px-6 shadow-sm"
              >
                Xác nhận
              </Button>
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
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between">
        <div className="flex items-center gap-2 px-2">
          <Microscope className="text-primary w-5 h-5" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">Dạng Toán {index + 1}</h2>
        </div>
        <div className="flex items-center gap-2">
          {onRemove && (
            <Button
              variant="ghost"
              onClick={onRemove}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs h-8 px-3"
            >
              <Trash2 className="w-3 h-3 mr-1.5" />
              Xóa Dạng Toán
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

import React, { useRef, useState } from 'react'
import { Microscope, ImagePlus, Code, Plus, Trash2, ChevronDown, ChevronRight, GripVertical, CheckCircle2 } from 'lucide-react'
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [jsonInput, setJsonInput] = useState('')
  const [jsonError, setJsonError] = useState('')

  const handleSaveJson = () => {
    try {
      setJsonError('')
      const parsed = JSON.parse(jsonInput)
      
      const stepsData = parsed.steps || parsed.Steps;
      if (!stepsData || !Array.isArray(stepsData)) {
         throw new Error('JSON cần chứa mảng "Steps" (hoặc "steps").')
      }

      let html = `<div class="exercise-content bg-white p-4">`
      
      if (parsed.problem) {
         html += `<div class="bg-slate-50 p-5 rounded-lg border border-slate-200 mb-8">
            <p class="font-bold text-slate-900 mb-2 mt-0">Đề bài:</p>
            <p class="italic text-slate-700 m-0">${parsed.problem}</p>
          </div>`
      }

      const hasTimeline = (stepsData && Array.isArray(stepsData) && stepsData.length > 0) || parsed.conclusion || parsed.tips;

      if (hasTimeline) {
        html += `<div class="space-y-0">`
        
        let timelineItems: any[] = [];
        if (stepsData && Array.isArray(stepsData)) {
            stepsData.forEach((step: any, idx: number) => {
                timelineItems.push({
                    type: 'step',
                    idx: step.step || idx + 1,
                    title: step.title,
                    content: step.content,
                    formula: step.formula
                });
            });
        }
        if (parsed.conclusion) {
            timelineItems.push({
                type: 'conclusion',
                content: parsed.conclusion
            });
        }
        if (parsed.tips) {
            timelineItems.push({
                type: 'tips',
                content: parsed.tips
            });
        }

        timelineItems.forEach((item: any, i: number) => {
            const isLast = i === timelineItems.length - 1;
            
            html += `<div class="flex gap-4">
                <div class="flex-none flex flex-col items-center">`
                
            if (item.type === 'step') {
                html += `<p class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm m-0">${item.idx}</p>`
            } else if (item.type === 'conclusion') {
                html += `<p class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm m-0">✓</p>`
            } else if (item.type === 'tips') {
                html += `<p class="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm m-0">💡</p>`
            }

            if (!isLast) {
                html += `<div class="w-0.5 h-full bg-slate-200 my-1"></div>`
            }
            
            html += `</div>
                <div class="${isLast ? '' : 'pb-8'} flex-1 pt-1">`
                
            if (item.type === 'step') {
                if (item.title) {
                    html += `<h4 class="font-bold text-slate-900 m-0">${item.title}</h4>`
                }
                if (item.content) {
                    html += `<p class="text-slate-600 mt-1 mb-0">${item.content}</p>`
                }
                if (item.formula) {
                    html += `<p class="mt-3 text-blue-600 font-bold m-0">${item.formula.includes('$') ? item.formula : '$$' + item.formula + '$$'}</p>`
                }
            } else if (item.type === 'conclusion') {
                html += `<h4 class="font-bold text-slate-900 m-0">Kết luận</h4>
                         <p class="text-slate-600 mt-1 mb-0">${item.content}</p>`
            } else if (item.type === 'tips') {
                html += `<h4 class="font-bold text-slate-900 m-0">Gợi ý</h4>
                         <p class="text-slate-600 mt-1 mb-0">${item.content}</p>`
            }

            html += `</div></div>`
        });

        html += `</div>`
      }

      html += `</div>`

      onChange({ ...method, exercise: { content: html } })
      setIsModalOpen(false)
      setJsonInput('')
    } catch (e: any) {
      setJsonError('JSON không hợp lệ: ' + e.message)
    }
  }

  const exercise = method.exercise || { content: '' }

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
          <div className="flex flex-col gap-4">
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
            <div className="flex justify-end mb-3">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(true)}
                className="border-slate-300 hover:border-primary hover:text-primary transition-colors text-xs font-medium h-8 px-3 bg-white shadow-sm"
              >
                <Code className="w-3 h-3 mr-1.5" />
                Nhập JSON
              </Button>
            </div>
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

import React, { useRef, useState } from 'react'
import { Microscope, ImagePlus, Code, Plus, Trash2 } from 'lucide-react'
import { Button } from '../../ui/Button'
import MathText from '@/components/ui/MathText'

export interface ExampleStep {
  step: number;
  title: string;
  content: string;
  formula?: string;
}

export interface ExampleExercise {
  problem: string;
  steps: ExampleStep[];
  conclusion?: string;
  tips?: string;
}

interface ExampleExerciseCardProps {
  title: string;
  exercise: ExampleExercise | null;
  problemImage?: string | null;
  solutionImage?: string | null;
  onExerciseChange: (exercise: ExampleExercise) => void;
  onProblemImageChange: (image: string | null) => void;
  onSolutionImageChange: (image: string | null) => void;
  onRemoveExercise?: () => void;
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

export default function ExampleExerciseCard({
  title,
  exercise,
  problemImage,
  solutionImage,
  onExerciseChange,
  onProblemImageChange,
  onSolutionImageChange,
  onRemoveExercise,
}: ExampleExerciseCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [jsonInput, setJsonInput] = useState('')
  const [jsonError, setJsonError] = useState('')

  const handleSaveJson = () => {
    try {
      setJsonError('')
      const parsed = JSON.parse(jsonInput)
      
      let newExercise = exercise ? { ...exercise } : { problem: '', steps: [] }
      
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

      onExerciseChange(newExercise)
      setIsModalOpen(false)
      setJsonInput('')
    } catch (e: any) {
      setJsonError('JSON không hợp lệ: ' + e.message)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between">
        <div className="flex items-center gap-2 px-2">
          <Microscope className="text-primary w-5 h-5" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            className="border-slate-300 hover:border-primary hover:text-primary transition-colors text-xs h-8 px-3"
          >
            <Code className="w-3 h-3 mr-1.5" />
            Nhập JSON
          </Button>
          {onRemoveExercise && (
            <Button
              variant="ghost"
              onClick={onRemoveExercise}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs h-8 px-3"
            >
              <Trash2 className="w-3 h-3 mr-1.5" />
              Xóa
            </Button>
          )}
        </div>
      </div>

      <div className="p-8 flex-grow flex flex-col gap-8">
        {/* Bottom area: 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Cột trái: Tải ảnh minh hoạ */}
          <div className="flex flex-col gap-4">
            <ImageUploadArea 
              imageUrl={problemImage} 
              onChange={onProblemImageChange} 
              label="1. Ảnh Đề Bài" 
            />
            <ImageUploadArea 
              imageUrl={solutionImage} 
              onChange={onSolutionImageChange} 
              label="2. Ảnh Lời Giải" 
            />
          </div>

          {/* Cột phải: Preview Nội dung Đề bài, Steps và Kết luận */}
          <div className="flex flex-col h-full rounded-xl border border-slate-200 bg-white p-5 overflow-y-auto min-h-[300px] max-h-[600px]">
            {!exercise || (!exercise.problem && (!exercise.steps || exercise.steps.length === 0)) ? (
              <div className="flex-grow flex items-center justify-center text-slate-400 italic">
                Chưa có nội dung. Hãy nhập bằng JSON.
              </div>
            ) : (
              <div className="space-y-6 w-full">
                {exercise.problem && (
                  <div className="pb-4 border-b border-slate-100">
                    <h4 className="font-bold text-slate-700 mb-2">Đề bài</h4>
                    <MathText content={exercise.problem} className="text-slate-600" />
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
                        <MathText content={step.title} className="font-bold text-ink text-base" />
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



      {/* Modal Nhập JSON */}
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

import React, { useRef, useState } from 'react'
import { Microscope, ImagePlus, Code, Plus } from 'lucide-react'
import { Button } from '../../ui/Button'

export interface ExampleStep {
  step: number;
  title: string;
  content: string;
  formula?: string;
}

export interface ExampleExercise {
  title: string;
  problem: string;
  steps: ExampleStep[];
  conclusion?: string;
}

interface ExampleExerciseCardProps {
  title: string;
  exercise: ExampleExercise | null;
  imageUrl?: string | null;
  onExerciseChange: (exercise: ExampleExercise) => void;
  onImageChange: (image: string | null) => void;
  onAddExercise?: () => void;
  imageLabel?: string;
}

export default function ExampleExerciseCard({
  title,
  exercise,
  imageUrl,
  onExerciseChange,
  onImageChange,
  onAddExercise,
  imageLabel = "Kéo thả hoặc Tải ảnh"
}: ExampleExerciseCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [jsonInput, setJsonInput] = useState('')
  const [jsonError, setJsonError] = useState('')

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      onImageChange(url)
    }
  }

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    onImageChange(null)
  }

  const handleSaveJson = () => {
    try {
      setJsonError('')
      const parsed = JSON.parse(jsonInput)
      if (parsed.exercise) {
        onExerciseChange(parsed.exercise)
      } else {
        onExerciseChange(parsed)
      }
      setIsModalOpen(false)
      setJsonInput('')
    } catch (e: any) {
      setJsonError('JSON không hợp lệ: ' + e.message)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
        <Microscope className="text-primary w-5 h-5" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">{title}</h2>
      </div>

      <div className="p-8 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Cột trái: Tải ảnh minh hoạ */}
          <div className="flex flex-col gap-4">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
            <div 
              onClick={handleImageClick}
              className={`relative group border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center min-h-[250px] hover:border-primary/50 transition-colors cursor-pointer overflow-hidden ${imageUrl ? 'bg-white' : 'bg-slate-50/50'}`}
            >
              {imageUrl ? (
                <>
                  <img src={imageUrl} alt="Uploaded" className="w-full h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={handleRemoveImage}
                      className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors text-sm"
                    >
                      Xóa ảnh
                    </button>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="text-center">
                    <ImagePlus className="w-12 h-12 mx-auto text-slate-300 group-hover:text-primary transition-colors" />
                    <p className="mt-3 text-xs text-slate-500 font-bold uppercase tracking-widest">{imageLabel}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cột phải: Preview Nội dung */}
          <div className="flex flex-col h-full rounded-xl border border-slate-200 bg-white p-5 overflow-y-auto max-h-[500px]">
            {!exercise ? (
              <div className="flex-grow flex items-center justify-center text-slate-400 italic">
                Chưa có dữ liệu bài tập mẫu
              </div>
            ) : (
              <div className="space-y-6 w-full">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="font-bold mb-2">Đề bài:</p>
                  <p className="italic text-slate-700">{exercise.problem}</p>
                </div>

                <div className="space-y-4">
                  {exercise.steps?.map((step) => (
                    <div className="flex gap-4" key={step.step}>
                      <div className="flex-none flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                          {step.step}
                        </div>
                        <div className="w-0.5 h-full bg-slate-200 my-1"></div>
                      </div>
                      <div className="pb-4">
                        <h4 className="font-bold text-ink">{step.title}</h4>
                        <p className="text-slate-600 mt-1">{step.content}</p>
                        {step.formula && <p className="mt-2 latex-font text-primary font-bold">{step.formula}</p>}
                      </div>
                    </div>
                  ))}

                  {exercise.conclusion && (
                    <div className="flex gap-4">
                      <div className="flex-none flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                          ✓
                        </div>
                      </div>
                      <div>
                        <p className="mt-1 font-bold text-green-600">{exercise.conclusion}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3 justify-end">
        <Button variant="secondary" onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Code className="w-4 h-4" /> Thêm JSON
        </Button>
        {onAddExercise && (
          <Button onClick={onAddExercise} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Thêm bài tập mẫu
          </Button>
        )}
      </div>

      {/* JSON Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-lg">Nhập dữ liệu JSON</h3>
              <p className="text-sm text-slate-500">Dán mã JSON có cấu trúc exercise vào đây.</p>
            </div>
            <div className="p-5 flex-grow overflow-y-auto">
              <textarea
                className="w-full h-64 border border-slate-200 rounded-xl p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={'{\n  "exercise": {\n    "title": "Phân tích bài tập mẫu",\n    "problem": "Cho khối chóp..."\n  }\n}'}
              ></textarea>
              {jsonError && <p className="text-red-500 text-sm mt-2">{jsonError}</p>}
            </div>
            <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 rounded-b-2xl">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button onClick={handleSaveJson}>Xác nhận</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

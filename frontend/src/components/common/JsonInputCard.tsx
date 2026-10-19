import React, { useState, useEffect } from 'react'
import { Code2, Settings2, Sparkles, Upload } from 'lucide-react'

export interface JsonInputCardProps {
  title?: string;
  badge?: string;
  placeholder?: string;
  buttonText?: string;
  onProcess: (jsonString: string) => void;
  disabled?: boolean;
  initialValue?: string;
  onAiExtract?: () => void;
  aiButtonText?: string;
}

export default function JsonInputCard({
  title = 'Nhập nhanh bằng JSON',
  badge = 'Thông minh',
  placeholder = '',
  buttonText = 'Xử lý JSON',
  onProcess,
  disabled = false,
  initialValue = '',
  onAiExtract,
  aiButtonText
}: JsonInputCardProps) {
  const [jsonInput, setJsonInput] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialValue !== undefined) {
      setJsonInput(initialValue)
    }
  }, [initialValue])

  const handleFormat = () => {
    setError(null)
    if (!jsonInput.trim()) return
    try {
      const parsed = JSON.parse(jsonInput)
      setJsonInput(JSON.stringify(parsed, null, 2))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cú pháp không hợp lệ'
      setError(`JSON không hợp lệ: ${msg}`)
    }
  }

  const handleProcess = () => {
    setError(null)
    if (!jsonInput.trim()) {
      setError('Vui lòng nhập JSON')
      return
    }
    try {
      onProcess(jsonInput)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi khi xử lý JSON'
      setError(msg)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 relative shadow-primary/5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Code2 className="text-primary w-5 h-5" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight">{title}</h2>
          {badge && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-primary text-[9px] font-bold rounded uppercase">
              {badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onAiExtract && (
            <button
              type="button"
              disabled={disabled}
              onClick={onAiExtract}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 hover:text-indigo-900 border border-indigo-200/80 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Tải ảnh để AI tự động bóc tách"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>{aiButtonText || 'Tải ảnh câu hỏi'}</span>
            </button>
          )}

          <button
            type="button"
            disabled={disabled || !jsonInput.trim()}
            onClick={handleFormat}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Tự động căn chỉnh và thụt lề JSON"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Định dạng</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <textarea
          disabled={disabled}
          className={`w-full min-h-[160px] bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-primary focus:border-primary text-xs font-mono leading-relaxed placeholder:text-slate-400 disabled:opacity-50 ${
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20 bg-red-50/20' : ''
          }`}
          placeholder={placeholder}
          value={jsonInput}
          onChange={(e) => {
            setJsonInput(e.target.value)
            if (error) setError(null)
          }}
        />
        {error && <p className="text-red-500 text-xs font-semibold px-1">{error}</p>}
        <div className="flex justify-end">
          <button
            type="button"
            disabled={disabled}
            className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-primary/30 disabled:opacity-50"
            onClick={handleProcess}
          >
            <Settings2 className="w-4 h-4" />
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  )
}

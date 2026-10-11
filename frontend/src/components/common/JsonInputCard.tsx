import React, { useState } from 'react'
import { Code2, Settings2 } from 'lucide-react'

export interface JsonInputCardProps {
  title?: string;
  badge?: string;
  placeholder?: string;
  buttonText?: string;
  onProcess: (jsonString: string) => void;
  disabled?: boolean;
  initialValue?: string;
}

export default function JsonInputCard({
  title = 'Nhập nhanh bằng JSON',
  badge = 'Thông minh',
  placeholder = '',
  buttonText = 'Xử lý JSON',
  onProcess,
  disabled = false,
  initialValue = ''
}: JsonInputCardProps) {
  const [jsonInput, setJsonInput] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)

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
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Code2 className="text-primary w-5 h-5" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight">{title}</h2>
          {badge && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-primary text-[9px] font-bold rounded uppercase">
              {badge}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-4">
        <textarea
          disabled={disabled}
          className={`w-full min-h-[140px] bg-slate-50 border-slate-200 rounded-xl p-4 focus:ring-primary focus:border-primary text-xs font-mono placeholder:text-slate-400 disabled:opacity-50 ${
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''
          }`}
          placeholder={placeholder}
          value={jsonInput}
          onChange={(e) => {
            setJsonInput(e.target.value)
            if (error) setError(null)
          }}
        />
        {error && <p className="text-red-500 text-xs font-bold px-1">{error}</p>}
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

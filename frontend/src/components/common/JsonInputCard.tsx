import React, { useState, useEffect } from 'react'
import { Code2, Settings2, Upload, Copy, Check } from 'lucide-react'

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
  copyPromptText?: string;
  onCopyPrompt?: () => void;
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
  aiButtonText,
  copyPromptText,
  onCopyPrompt
}: JsonInputCardProps) {
  const [jsonInput, setJsonInput] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCopyPrompt = async () => {
    if (onCopyPrompt) {
      onCopyPrompt()
      return
    }
    if (copyPromptText) {
      try {
        await navigator.clipboard.writeText(copyPromptText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy prompt:', err)
      }
    }
  }

  useEffect(() => {
    if (initialValue !== undefined) {
      setJsonInput(initialValue)
    }
  }, [initialValue])

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

          {(copyPromptText || onCopyPrompt) && (
            <button
              type="button"
              disabled={disabled}
              onClick={handleCopyPrompt}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Sao chép prompt chuẩn để gửi cho AI (ChatGPT, Claude, Gemini...)"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              <span>{copied ? 'Đã sao chép prompt' : 'Sao chép prompt'}</span>
            </button>
          )}
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

import React, { useState, useEffect } from 'react'
import { Code2, Settings2, Upload, Copy, Check, ChevronDown } from 'lucide-react'

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
  collapsible?: boolean;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
  subtitle?: string;
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
  onCopyPrompt,
  collapsible = false,
  defaultOpen = false,
  isOpen,
  onToggleOpen,
  subtitle
}: JsonInputCardProps) {
  const [jsonInput, setJsonInput] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [internalOpen, setInternalOpen] = useState(defaultOpen)

  const isControlled = isOpen !== undefined
  const currentOpen = isControlled ? isOpen : internalOpen

  const handleToggle = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen)
    }
    onToggleOpen?.(nextOpen)
  }

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

  if (collapsible) {
    return (
      <details
        open={currentOpen}
        onToggle={(e) => {
          const next = (e.currentTarget as HTMLDetailsElement).open
          handleToggle(next)
        }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 relative shadow-primary/5 transition-all group"
      >
        <summary className="flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight">{title}</h2>
                {badge && (
                  <span className="px-2 py-0.5 bg-blue-50 text-primary border border-blue-200/60 text-xs font-bold rounded-lg uppercase tracking-wider">
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 group-hover:bg-slate-200 rounded-xl transition-colors min-h-[36px]">
              <span>{currentOpen ? 'Thu gọn khung nhập' : 'Mở rộng khung nhập'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${currentOpen ? 'rotate-180' : ''}`} />
            </span>
          </div>
        </summary>

        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {onAiExtract && (
              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  onAiExtract()
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-colors cursor-pointer shadow-2xs min-h-[36px]"
                title="Tải ảnh để AI tự động bóc tách"
              >
                <Upload className="w-3.5 h-3.5 text-primary" />
                <span>{aiButtonText || 'Tải ảnh câu hỏi'}</span>
              </button>
            )}

            {(copyPromptText || onCopyPrompt) && (
              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  handleCopyPrompt()
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs min-h-[36px]"
                title="Sao chép prompt chuẩn để gửi cho AI (ChatGPT, Claude, Gemini...)"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                <span>{copied ? 'Đã sao chép prompt' : 'Sao chép prompt'}</span>
              </button>
            )}
          </div>

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
              className="bg-primary hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-primary/20 disabled:opacity-50 min-h-[40px] cursor-pointer"
              onClick={handleProcess}
            >
              <Settings2 className="w-4 h-4" />
              {buttonText}
            </button>
          </div>
        </div>
      </details>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 relative shadow-primary/5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Code2 className="text-primary w-5 h-5" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight">{title}</h2>
          {badge && (
            <span className="px-2 py-0.5 bg-blue-50 text-primary border border-blue-200/60 text-xs font-bold rounded-lg uppercase tracking-wider">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-colors cursor-pointer shadow-2xs min-h-[36px]"
              title="Tải ảnh để AI tự động bóc tách"
            >
              <Upload className="w-3.5 h-3.5 text-primary" />
              <span>{aiButtonText || 'Tải ảnh câu hỏi'}</span>
            </button>
          )}

          {(copyPromptText || onCopyPrompt) && (
            <button
              type="button"
              disabled={disabled}
              onClick={handleCopyPrompt}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs min-h-[36px]"
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
            className="bg-primary hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-primary/20 disabled:opacity-50 min-h-[40px] cursor-pointer"
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

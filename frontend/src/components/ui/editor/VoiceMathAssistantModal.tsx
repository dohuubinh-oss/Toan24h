'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Sparkles, X, Check, Volume2, CornerDownLeft } from 'lucide-react'
import MathText from '@/components/ui/MathText'
import { Button } from '@/components/ui/Button'
import { vietnameseMathToLatex } from '@/lib/math-speech/vietnameseMathToLatex'

export interface VoiceMathAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (latex: string, isInlineMath?: boolean) => void
}

export default function VoiceMathAssistantModal({
  isOpen,
  onClose,
  onInsert,
}: VoiceMathAssistantModalProps) {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const recognitionRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const conversion = vietnameseMathToLatex(transcript)

  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
      setTranscript('')
      return
    }

    // Auto-focus input when open
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)

    if (typeof window === 'undefined') return
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechSupported(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'vi-VN'
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onresult = (event: any) => {
        let currentText = ''
        for (let i = 0; i < event.results.length; ++i) {
          currentText += event.results[i][0].transcript
        }
        setTranscript(currentText)
      }

      recognition.onerror = (err: any) => {
        console.error('Speech recognition error', err)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    } catch (e) {
      console.error('Speech recognition initialization error', e)
      setSpeechSupported(false)
    }
  }, [isOpen])

  // Handle ESC and Enter keydown
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter') {
        if (conversion.latex) {
          e.preventDefault()
          handleInsert()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, conversion.latex])

  const toggleListening = () => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setTranscript('')
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (e) {
        console.error(e)
      }
    }
  }

  const handleInsert = () => {
    if (conversion.latex) {
      onInsert(conversion.latex, conversion.isMath)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-600 via-primary to-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin-slow" />
            <div>
              <h3 className="font-bold text-sm leading-tight">Trợ lý Nói & Nhập Toán</h3>
              <p className="text-[11px] text-white/80">Tự động dịch giọng nói / câu tiếng Việt sang LaTeX</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white/90 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Input text / speech text */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Nói hoặc gõ văn bản tiếng Việt
              </label>
              {isListening && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> Đang lắng nghe...
                </span>
              )}
            </div>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Nói hoặc gõ công thức tiếng Việt (vd: x bình phương cộng hai x trừ năm bằng không)..."
                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-sm font-medium text-slate-800 placeholder:text-slate-400"
              />
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                    isListening
                      ? 'bg-rose-500 text-white animate-bounce shadow-md shadow-rose-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-primary'
                  }`}
                  title={isListening ? 'Dừng lắng nghe' : 'Bật micro'}
                >
                  {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* KaTeX Live Preview */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 min-h-[90px] flex flex-col justify-center items-center text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Xem trước công thức (KaTeX Live Preview)
            </span>
            {conversion.latex ? (
              <div className="text-lg font-bold text-primary py-1">
                <MathText content={`$${conversion.latex}$`} />
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Đang chờ bạn nói hoặc gõ câu toán...</p>
            )}
            {conversion.latex && (
              <code className="text-[11px] text-slate-600 font-mono mt-1.5 bg-white px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                {conversion.latex}
              </code>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {speechSupported ? '🎙️ Bấm Mic để nói (hỗ trợ Chrome/Edge)' : '⌨️ Gõ tự nhiên để chuyển sang LaTeX'}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!conversion.latex}
              onClick={handleInsert}
              className="gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" /> Chèn vào bài
              <CornerDownLeft className="w-3 h-3 opacity-60 ml-0.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

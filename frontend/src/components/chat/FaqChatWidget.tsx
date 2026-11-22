'use client'

import React, { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { MessageSquare, X, Send, Sparkles, Bot, Loader2, HelpCircle } from 'lucide-react'
import { sendFaqChatMessage, FaqChatResponse } from '@/lib/api'

interface ChatMessage {
  id: string
  sender: 'user' | 'bot'
  text: string
  sources?: FaqChatResponse['sources']
  timestamp: Date
}

const QUICK_PROMPTS = [
  'Gói học VIP giá bao nhiêu?',
  'Quy chế chống gian lận phòng thi?',
  'Điều kiện mở khóa bài giảng?',
  'Liên kết phụ huynh qua Telegram?',
]

export default function FaqChatWidget() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Dạ toan6789.vn xin chào bạn! Mình là Trợ lý AI học tập. Mình có thể giải đáp ngay các thông tin về bảng giá VIP, quy chế phòng thi, mở khóa bài giảng hoặc liên kết Telegram phụ huynh. Bạn cần hỗ trợ gì ạ?',
      timestamp: new Date(),
    },
  ])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Strict Rule: Never show chat widget inside active exam room
  const isExamRoom = pathname && pathname.includes('/exam/') && pathname.includes('/take')

  useEffect(() => {
    if (isOpen) {
      if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      }
      inputRef.current?.focus()
    }
  }, [isOpen, messages])

  if (isExamRoom) {
    return null
  }

  const handleSend = async (questionText?: string) => {
    const textToSend = (questionText || input).trim()
    if (!textToSend || loading) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!questionText) {
      setInput('')
    }
    setLoading(true)

    try {
      const res = await sendFaqChatMessage(textToSend)
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.answer,
        sources: res.sources,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: err?.message || 'Dạ hiện tại em chưa thể phản hồi. Bạn vui lòng thử lại sau ít phút hoặc liên kết Telegram @toan6789_bot nhé!',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <aside aria-label="Trợ lý AI Hỏi đáp toan6789.vn" className="fixed bottom-5 right-5 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
          aria-label="Hỏi đáp AI - Mở trợ lý giải đáp thắc mắc"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <Bot className="w-5 h-5" />
          <span className="text-sm font-semibold tracking-wide hidden sm:inline">Hỏi đáp AI</span>
        </button>
      )}

      {/* Chat Popup Box */}
      {isOpen && (
        <div
          className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-[92vw] sm:w-[380px] h-[520px] max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300"
          role="dialog"
          aria-modal="true"
          aria-label="Khung hội thoại trợ lý FAQ toan6789.vn"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3.5 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Trợ lý AI toan6789.vn</h3>
                <p className="text-[11px] text-blue-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Tư vấn trực tuyến
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors"
              aria-label="Đóng khung chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60 text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200/60 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line text-[13px]">{msg.text}</p>
                </div>

                {/* Sources badges if available */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1 max-w-[85%]">
                    <span className="text-[10px] text-slate-600 flex items-center gap-1 font-medium">
                      <HelpCircle className="w-3 h-3 text-slate-600" /> Nguồn từ toan6789.vn:
                    </span>
                    {msg.sources.map((src, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200/60"
                        title={src.question}
                      >
                        {src.category === 'pricing'
                          ? 'Bảng giá VIP'
                          : src.category === 'exam_rules'
                          ? 'Quy chế thi'
                          : src.category === 'progression'
                          ? 'Lộ trình học'
                          : 'Hỏi đáp'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-600 text-xs py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Trợ lý AI đang tra cứu quy chế & soạn câu trả lời...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto scrollbar-none">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                  className="whitespace-nowrap text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 px-2.5 py-1 rounded-full transition-colors font-medium border border-slate-200/60"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Nhập câu hỏi của bạn (ví dụ: giá gói VIP)..."
              maxLength={500}
              className="flex-1 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 placeholder-slate-600 transition-all"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2.5 rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Gửi câu hỏi"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}

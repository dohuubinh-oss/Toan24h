'use client'

import React from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import JsonInputSection from '../../../../components/questions/creator/JsonInputSection'
import QuestionEditorSection from '../../../../components/questions/creator/QuestionEditorSection'
import QuestionSettingsSidebar from '../../../../components/questions/creator/QuestionSettingsSidebar'

export default function CreateQuestionPage() {
  return (
    <div className="bg-page-bg min-h-screen font-display pb-20 lg:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/questions" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-800">Smart Question Creator</h1>
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded uppercase tracking-widest border border-red-200">
              Câu hỏi chùm
            </span>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-3">
          <button className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
            Xem trước
          </button>
          <button className="bg-primary hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-sm shadow-primary/20">
            <Save className="w-4 h-4" />
            Lưu vào ngân hàng
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-[1920px] mx-auto p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column - Input and Editor */}
          <div className="lg:col-span-8 space-y-6">
            <JsonInputSection />
            <QuestionEditorSection />
          </div>

          {/* Right Column - Sidebar Settings */}
          <div className="lg:col-span-4">
            <QuestionSettingsSidebar />
          </div>

        </div>
      </main>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex gap-3 z-50">
        <button className="flex-1 py-4 border border-slate-200 rounded-xl font-bold text-sm uppercase tracking-widest text-slate-700">
          Xem trước
        </button>
        <button className="flex-1 py-4 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-primary/20">
          Lưu vào
        </button>
      </div>
    </div>
  )
}

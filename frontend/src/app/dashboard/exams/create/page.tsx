import React, { Suspense } from 'react'
import ExamHeader from '../../../../components/exams/ExamHeader'
import ExamQuestionList from '../../../../components/exams/ExamQuestionList'
import ExamConfigSidebar from '../../../../components/exams/ExamConfigSidebar'
import { Grid, UploadCloud } from 'lucide-react'

export default function CreateExamPage() {
  return (
    <Suspense fallback={<div className="p-8">Đang tải dữ liệu...</div>}>
      <CreateExamPageContent />
    </Suspense>
  )
}

function CreateExamPageContent() {
  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen pb-20 lg:pb-0 font-body">
      <ExamHeader />
      
      <main className="max-w-[1440px] mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <ExamQuestionList />
        <ExamConfigSidebar />
      </main>

      {/* Mobile Footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex gap-3 z-40 shadow-2xl">
        <button className="flex-1 flex items-center justify-center gap-2 px-4 h-12 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold">
          <Grid className="w-5 h-5" />
          Ma trận
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 px-4 h-12 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/30">
          <UploadCloud className="w-5 h-5" />
          Lưu đề thi
        </button>
      </div>
    </div>
  )
}

import React, { Suspense } from 'react'
import ExamHeader from '../../../../components/exams/ExamHeader'
import ExamQuestionList from '../../../../components/exams/ExamQuestionList'
import ExamConfigSidebar from '../../../../components/exams/ExamConfigSidebar'
import { Grid, UploadCloud } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'

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
      
      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <ExamQuestionList />
        <ExamConfigSidebar />
      </main>

      {/* Mobile Footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex gap-3 z-40 shadow-2xl">
        <Button variant="secondary" className="flex-1 h-12 rounded-xl text-sm font-bold gap-2">
          <Grid className="w-5 h-5" />
          Ma trận
        </Button>
        <Button className="flex-1 h-12 rounded-xl text-sm font-bold gap-2 shadow-lg shadow-primary/30">
          <UploadCloud className="w-5 h-5" />
          Lưu đề thi
        </Button>
      </div>
    </div>
  )
}

'use client';

import React, { useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import QuestionCard from '../../components/questions/QuestionCard';
import GroupQuestionCard from '../../components/questions/GroupQuestionCard';
import FloatingActionBar from '../../components/questions/FloatingActionBar';

export default function QuestionsPage() {
  const [selectedCount, setSelectedCount] = useState(2);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-page-bg p-6">
        <div className="flex flex-col gap-6 max-w-6xl mx-auto relative">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <span className="hover:text-primary cursor-pointer transition-colors">Admin</span>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-primary font-bold">Ngân hàng câu hỏi</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Danh sách câu hỏi</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="flex items-center gap-2 bg-card-bg border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-all text-slate-700">
                <span className="material-symbols-outlined text-xl">upload_file</span>
                Nhập từ JSON
              </button>
              <button className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all">
                <span className="material-symbols-outlined text-xl">add</span>
                Tạo đề thi
              </button>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-4 pb-20">
            {/* Standard Question */}
            <QuestionCard 
              id="Q-7721"
              grade={9}
              topic="Giải tích"
              difficulty="Thông hiểu"
              content="Cho hàm số $f(x) = \frac{x^2 - 4}{x - 2}$. Tính giá trị của giới hạn $\lim_{x \to 2} f(x)$."
              options={[
                "$\\lim_{x \\to 2} f(x) = 0$",
                "$\\lim_{x \\to 2} f(x) = 4$",
                "$\\lim_{x \\to 2} f(x) = 2$",
                "Giới hạn không tồn tại"
              ]}
              correctAnswer="B"
              updatedAt="12/10/2023"
            />

            {/* Grouped Question */}
            <GroupQuestionCard />

            {/* Simple Question */}
            <QuestionCard 
              id="Q-4491"
              grade={7}
              topic="Đại số"
              difficulty="Nhận biết"
              content="Giải bất phương trình: $x^2 - 5x + 6 > 0$"
              updatedAt="01/12/2023"
            />
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 pb-20">
            <p className="text-sm text-slate-500">Hiển thị <span className="font-bold text-slate-800">1 - 10</span> trong số <span className="font-bold text-slate-800">1,284</span> câu hỏi</p>
            <div className="flex items-center gap-1">
              <button className="p-2 text-slate-400 hover:text-primary disabled:opacity-30" disabled>
                <span className="material-symbols-outlined">first_page</span>
              </button>
              <button className="p-2 text-slate-400 hover:text-primary disabled:opacity-30" disabled>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="w-8 h-8 rounded bg-primary text-white text-xs font-bold">1</button>
              <button className="w-8 h-8 rounded hover:bg-slate-100 text-slate-600 text-xs font-bold">2</button>
              <button className="w-8 h-8 rounded hover:bg-slate-100 text-slate-600 text-xs font-bold">3</button>
              <span className="px-1 text-slate-400">...</span>
              <button className="w-8 h-8 rounded hover:bg-slate-100 text-slate-600 text-xs font-bold">129</button>
              <button className="p-2 text-slate-400 hover:text-primary">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
              <button className="p-2 text-slate-400 hover:text-primary">
                <span className="material-symbols-outlined">last_page</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Bar */}
      <FloatingActionBar selectedCount={selectedCount} onClose={() => setSelectedCount(0)} />
    </div>
  );
}

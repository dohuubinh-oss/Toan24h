import React from 'react';
import MathText from '../ui/MathText';

export default function GroupQuestionCard() {
  return (
    <div className="bg-card-bg rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <input className="rounded border-slate-300 text-primary focus:ring-primary h-5 w-5 cursor-pointer" type="checkbox" />
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded uppercase">LỚP 6 - Hình học</span>
            <span className="px-2 py-1 bg-red-500/10 text-red-600 text-xs font-bold rounded uppercase">Vận dụng cao</span>
            <span className="text-xs text-slate-400 font-medium">ID: #Q-CLUSTER-81</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer"><span className="material-symbols-outlined text-xl">edit</span></button>
          </div>
        </div>

        {/* Shared Context */}
        <div className="bg-white p-4 rounded-lg border-l-4 border-primary shadow-sm mb-6 ml-7">
          <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Nội dung dẫn chung</h4>
          <MathText content="Cho hình chóp S.ABCD có đáy ABCD là hình thang vuông tại A và D. Biết $AD = CD = a$, $AB = 2a$. Cạnh bên $SA$ vuông góc với mặt đáy $(ABCD)$." className="text-base text-slate-700 italic" />
        </div>

        {/* Sub-questions */}
        <div className="space-y-6 ml-7">
          <div className="relative pl-6 border-l-2 border-slate-100">
            <span className="absolute -left-[1px] top-0 w-2 h-2 bg-slate-300 rounded-full"></span>
            <MathText content="1. Tính khoảng cách từ điểm B đến mặt phẳng (SCD)." className="text-md text-slate-800 mb-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <MathText content="A. $a\sqrt{2}$" className="text-sm p-2 border border-slate-100 rounded bg-white" />
              <div className="text-sm p-2 border border-slate-100 rounded bg-white font-bold text-primary flex justify-between items-center">
                <MathText content="B. $a\sqrt{3}/2$" /> <span className="material-symbols-outlined text-sm">check</span>
              </div>
            </div>
          </div>
          <div className="relative pl-6 border-l-2 border-slate-100">
            <span className="absolute -left-[1px] top-0 w-2 h-2 bg-slate-300 rounded-full"></span>
            <MathText content="2. Xác định tâm và bán kính mặt cầu ngoại tiếp hình chóp S.ABCD." className="text-md text-slate-800 mb-3" />
            <div className="italic text-xs text-slate-500">Dạng bài: Tự luận</div>
          </div>
        </div>
      </div>
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400">Lần cuối cập nhật: 05/11/2023 bởi GV. Lê Thu</span>
        </div>
        <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
          Xem đáp án mẫu
          <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
